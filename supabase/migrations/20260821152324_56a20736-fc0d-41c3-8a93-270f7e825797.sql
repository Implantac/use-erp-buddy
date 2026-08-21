
-- Adicionar colunas de escopo ao log de auditoria
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);

-- Garantir privilégios
GRANT INSERT, SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- Comentário para documentação
COMMENT ON COLUMN public.audit_logs.company_id IS 'Empresa associada à ação auditada (opcional)';
COMMENT ON COLUMN public.audit_logs.unit_id IS 'Unidade associada à ação auditada (opcional)';
