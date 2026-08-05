/**
 * Helper zero-dependency untuk export data ke file CSV.
 * Menambahkan UTF-8 BOM (\uFEFF) agar Microsoft Excel membuka file dengan encoding UTF-8 secara otomatis.
 */
export type CSVHeader<T> = {
  key: keyof T | string;
  label: string;
  formatter?: (value: any, row: T) => string | number;
};

export function downloadCSV<T extends Record<string, any>>(
  filename: string,
  headers: CSVHeader<T>[],
  data: T[],
) {
  if (!data || data.length === 0) return;

  const headerRow = headers.map((h) => escapeCSV(h.label)).join(",");

  const bodyRows = data.map((row) =>
    headers
      .map((h) => {
        let val = row[h.key as string];
        if (h.formatter) {
          val = h.formatter(val, row);
        }
        return escapeCSV(val ?? "");
      })
      .join(","),
  );

  const csvContent = "\uFEFF" + [headerRow, ...bodyRows].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    filename.endsWith(".csv") ? filename : `${filename}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(val: any): string {
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
