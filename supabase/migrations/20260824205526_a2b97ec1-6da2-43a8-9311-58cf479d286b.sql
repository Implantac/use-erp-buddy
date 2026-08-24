INSERT INTO public.report_templates (tenant_id, name, description, category, config)
SELECT t.id, v.name, v.description, v.category::report_category, v.config::jsonb
FROM public.tenants t
CROSS JOIN (VALUES
  ('Quadro de Colaboradores', 'Colaboradores ativos, admissões e salários por período.', 'hr', '{"fields":["full_name","hire_date","salary","status"]}'),
  ('Posição de Estoque', 'Saldo atual, estoque mínimo e custos por produto.', 'inventory', '{"fields":["name","sku","stock_quantity","min_stock","price"]}')
) AS v(name, description, category, config)
WHERE NOT EXISTS (
  SELECT 1 FROM public.report_templates rt
  WHERE rt.tenant_id = t.id AND rt.category = v.category::report_category
);