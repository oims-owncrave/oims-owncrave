import * as XLSX from "xlsx";
import type { ImportColumn } from "./types";

// Generate + download file .xlsx template: baris header + 1 baris contoh.
export function downloadTemplate(
  filename: string,
  columns: ImportColumn[],
) {
  const header = columns.map((c) => c.header);
  const example = columns.map((c) => c.example);
  const aoa = [header, example];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // lebar kolom biar kebaca
  ws["!cols"] = columns.map((c) => ({ wch: Math.max(c.header.length, c.example.length, 14) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
