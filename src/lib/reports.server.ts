import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type ReportCategory = "sales" | "finance" | "hr" | "logistics" | "inventory";

type SourceConfig = {
  table: string;
  columns: string[];
  dateColumn: string | null;
  orderColumn: string;
};

const SOURCES: Record<ReportCategory, SourceConfig> = {
  sales: {
    table: "sales",
    columns: ["id", "status", "total_amount", "discount_amount", "final_amount", "created_at"],
    dateColumn: "created_at",
    orderColumn: "created_at",
  },
  finance: {
    table: "transactions",
    columns: ["id", "type", "category", "description", "amount", "status", "date"],
    dateColumn: "date",
    orderColumn: "date",
  },
  hr: {
    table: "employees",
    columns: ["id", "full_name", "email", "phone", "hire_date", "salary", "status"],
    dateColumn: "hire_date",
    orderColumn: "hire_date",
  },
  logistics: {
    table: "shipments",
    columns: ["id", "tracking_code", "status", "shipped_at", "delivered_at", "estimated_delivery", "created_at"],
    dateColumn: "created_at",
    orderColumn: "created_at",
  },
  inventory: {
    table: "products",
    columns: ["id", "name", "sku", "brand", "stock_quantity", "min_stock", "unit_of_measure", "price", "cost_price", "active"],
    dateColumn: "created_at",
    orderColumn: "name",
  },
};

export type ReportFilters = {
  from?: string | undefined;
  to?: string | undefined;
  company_id?: string | undefined;
  unit_id?: string | undefined;
};

export type ReportData = {
  columns: string[];
  rows: Record<string, unknown>[];
};

/** Consolida os dados do relatório respeitando o isolamento por tenant. */
export async function buildReportData(
  category: ReportCategory,
  tenantId: string,
  filters: ReportFilters,
): Promise<ReportData> {
  const source = SOURCES[category];
  if (!source) throw new Error(`Categoria de relatório não suportada: ${category}`);

  const db = supabaseAdmin as any;
  let query = db
    .from(source.table)
    .select(source.columns.join(","))
    .eq("tenant_id", tenantId)
    .order(source.orderColumn, { ascending: false })
    .limit(5000);

  if (source.dateColumn && filters.from) query = query.gte(source.dateColumn, filters.from);
  if (source.dateColumn && filters.to) query = query.lte(source.dateColumn, filters.to);

  // Escopo geográfico só existe em algumas tabelas.
  if (filters.company_id && (source.table === "employees" || source.table === "transactions")) {
    query = query.eq("company_id", filters.company_id);
  }
  if (filters.unit_id && source.table === "employees") {
    query = query.eq("unit_id", filters.unit_id);
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    columns: source.columns,
    rows: (data ?? []) as unknown as Record<string, unknown>[],
  };
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(report: ReportData): string {
  const header = report.columns.join(";");
  const lines = report.rows.map((row) => report.columns.map((c) => csvCell(row[c])).join(";"));
  // BOM garante acentuação correta no Excel.
  return "\uFEFF" + [header, ...lines].join("\r\n");
}

function pdfEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Gera um PDF simples (tabular, monoespaçado) sem dependências nativas. */
export function toPdf(title: string, report: ReportData): Uint8Array {
  const rowsPerPage = 40;
  const colWidth = Math.max(10, Math.floor(110 / Math.max(1, report.columns.length)));
  const fmt = (v: unknown) => {
    const text = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return text.slice(0, colWidth).padEnd(colWidth, " ");
  };

  const lineGroups: string[][] = [];
  for (let i = 0; i < Math.max(1, report.rows.length); i += rowsPerPage) {
    const chunk = report.rows.slice(i, i + rowsPerPage);
    lineGroups.push([
      title,
      `Gerado em ${new Date().toLocaleString("pt-BR")} — ${report.rows.length} registro(s)`,
      "",
      report.columns.map((c) => fmt(c)).join(" "),
      "".padEnd(colWidth * report.columns.length, "-"),
      ...(chunk.length ? chunk.map((r) => report.columns.map((c) => fmt(r[c])).join(" ")) : ["Nenhum registro encontrado."]),
    ]);
  }

  const objects: string[] = [];
  const pageIds = lineGroups.map((_, i) => 4 + i * 2);

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>";

  lineGroups.forEach((lines, index) => {
    const pageId = pageIds[index]!;
    const contentId = pageId + 1;
    const text =
      "BT /F1 7 Tf 8 812 Td 9 TL\n" +
      lines.map((l) => `(${pdfEscape(l)}) Tj T*`).join("\n") +
      "\nET";
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${text.length} >>\nstream\n${text}\nendstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 1; i < objects.length; i++) {
    if (!objects[i]) continue;
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = pdf.length;
  const maxId = objects.length;
  pdf += `xref\n0 ${maxId}\n0000000000 65535 f \n`;
  for (let i = 1; i < maxId; i++) {
    pdf += `${String(offsets[i] ?? 0).padStart(10, "0")} 00000 ${offsets[i] ? "n" : "f"} \n`;
  }
  pdf += `trailer\n<< /Size ${maxId} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

export async function uploadReportFile(
  path: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from("reports")
    .upload(path, body, { contentType, upsert: true });
  if (error) throw error;
}

export async function createReportSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from("reports")
    .createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
