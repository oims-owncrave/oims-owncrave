import * as XLSX from "xlsx";
import type { ImportColumn } from "./types";

// Baca File .xlsx -> array baris object { [key]: string }.
// Cocokkan header Excel (case-insensitive, trim) ke ImportColumn.key.
export async function parseXlsx(
  file: File,
  columns: ImportColumn[],
): Promise<{ rows: Record<string, string>[]; error?: string }> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { rows: [], error: "File Excel kosong / tidak ada sheet." };
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return { rows: [], error: "Sheet Excel tidak dapat dibaca." };

  // header: 1 -> array of array (baris pertama = header). raw: false -> semua string.
  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
  if (matrix.length < 2) return { rows: [], error: "File tidak berisi data (hanya header)." };

  const headerRow = (matrix[0] ?? []).map((h) => String(h).trim().toLowerCase());
  // map index kolom Excel -> key internal
  const colIndex: Record<string, number> = {};
  for (const col of columns) {
    const idx = headerRow.indexOf(col.header.toLowerCase());
    if (idx === -1 && col.required) {
      return { rows: [], error: `Kolom wajib "${col.header}" tidak ditemukan di header Excel.` };
    }
    colIndex[col.key] = idx;
  }

  const rows: Record<string, string>[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const raw = matrix[r] ?? [];
    // skip baris kosong total
    if (raw.every((c) => String(c).trim() === "")) continue;
    const obj: Record<string, string> = {};
    for (const col of columns) {
      const idx = colIndex[col.key];
      obj[col.key] = idx !== undefined && idx >= 0 ? String(raw[idx] ?? "").trim() : "";
    }
    rows.push(obj);
  }
  return { rows };
}
