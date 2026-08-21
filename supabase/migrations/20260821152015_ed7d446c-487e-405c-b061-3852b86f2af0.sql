
-- Adicionar campos de permissão granular na tabela user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);

-- Atualizar a função has_role para considerar escopo de empresa e unidade opcionalmente
CREATE OR REPLACE FUNCTION public.check_access(_user_id uuid, _company_id uuid DEFAULT NULL, _unit_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o usuário é um admin global do tenant, tem acesso a tudo
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin' AND company_id IS NULL AND unit_id IS NULL
  ) THEN
    RETURN TRUE;
  END IF;

  -- Se for filtrado por empresa
  IF _company_id IS NOT NULL AND _unit_id IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = _user_id AND company_id = _company_id
    );
  END IF;

  -- Se for filtrado por unidade
  IF _unit_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = _user_id AND (unit_id = _unit_id OR (company_id IS NOT NULL AND company_id = (SELECT company_id FROM public.units WHERE id = _unit_id)))
    );
  END IF;

  -- Se não houver filtro, mas o usuário tiver algum papel, ele tem acesso ao tenant
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
END;
$$;

GRANT SELECT, UPDATE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
