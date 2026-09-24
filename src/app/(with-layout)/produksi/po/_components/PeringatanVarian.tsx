export function PeringatanVarian({ labels }: { labels: string[] }) {
  if (!labels.length) return null;
  return (
    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
      ⚠ <strong>{labels.join(", ")}</strong> belum punya bahan khusus di BOM — cek BOM kalau
      seharusnya ada.
    </div>
  );
}
