"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Upload, X, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toastStyles } from "@/lib/utils";
import type { ImportColumn, ImportResult, RowError } from "@/lib/import/types";
import { parseXlsx } from "@/lib/import/parse-xlsx";
import { downloadTemplate } from "@/lib/import/template";

export type ImportConfig = {
  title: string;
  templateFilename: string;
  columns: ImportColumn[];
  action: (rows: Record<string, string>[]) => Promise<ImportResult>;
  onSuccess: () => void;
};

interface ImportExcelModalProps {
  open: boolean;
  onClose: () => void;
  config: ImportConfig;
}

export function ImportExcelModal({
  open,
  onClose,
  config,
}: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<RowError[] | null>(null);
  const [isPending, setIsPending] = useState(false);

  if (!open) return null;

  const handleReset = () => {
    setFile(null);
    setRows(null);
    setParseError(null);
    setRowErrors(null);
    setIsPending(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError(null);
    setRowErrors(null);
    setRows(null);

    const res = await parseXlsx(selectedFile, config.columns);
    if (res.error) {
      setParseError(res.error);
    } else {
      setRows(res.rows);
    }
  };

  const handleSubmit = async () => {
    if (!rows || !rows.length) return;
    setIsPending(true);
    setRowErrors(null);

    try {
      const res = await config.action(rows);
      if (res.error) {
        toast.error(res.error);
      } else if (res.errors && res.errors.length > 0) {
        setRowErrors(res.errors);
        toast.error(`Terdapat ${res.errors.length} baris yang bermasalah. Perbaiki file dan upload ulang.`);
      } else if (res.inserted) {
        toast.success(`${res.inserted} data berhasil diimport`, toastStyles.primary);
        handleClose();
        config.onSuccess();
      }
    } catch (err) {
      toast.error("Gagal melakukan import data.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-xl border border-stroke bg-white p-6 shadow-xl dark:border-dark-3 dark:bg-gray-dark">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke pb-4 dark:border-dark-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-dark dark:text-white">
                {config.title}
              </h3>
              <p className="text-xs text-dark-5 dark:text-dark-6">
                Upload file Excel (.xlsx) sesuai template
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-dark-5 hover:bg-gray-1 hover:text-dark dark:text-dark-6 dark:hover:bg-dark-2 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="my-5 space-y-4">
          {/* Step 1: Download Template */}
          <div className="flex items-center justify-between rounded-lg border border-stroke p-3 bg-gray-1 dark:border-dark-3 dark:bg-dark-2">
            <div className="text-xs text-dark-5 dark:text-dark-6">
              Belum punya formatnya? Download template Excel di sini.
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate(config.templateFilename, config.columns)}
              className="shrink-0 border-primary text-primary hover:bg-primary/5 dark:border-primary dark:text-white"
            >
              <Download size={14} className="mr-1.5" />
              Template
            </Button>
          </div>

          {/* Step 2: Upload File */}
          <div>
            <label className="block text-sm font-medium text-dark dark:text-white mb-2">
              Pilih File Excel (.xlsx)
            </label>
            <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stroke p-6 text-center transition hover:border-primary dark:border-dark-3 dark:hover:border-primary">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <Upload size={28} className="mb-2 text-dark-5 dark:text-dark-6" />
              {file ? (
                <div>
                  <p className="text-sm font-semibold text-dark dark:text-white">
                    {file.name}
                  </p>
                  {rows && (
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-1">
                      ✓ {rows.length} baris data terbaca
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-dark dark:text-white">
                    Klik atau drag file .xlsx ke sini
                  </p>
                  <p className="text-xs text-dark-5 dark:text-dark-6 mt-0.5">
                    Maksimal format file .xlsx
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Row Errors Preview */}
          {rowErrors && rowErrors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                <AlertCircle size={14} />
                <span>Daftar Baris Bermasalah ({rowErrors.length}):</span>
              </div>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50/50 p-3 space-y-1 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                {rowErrors.map((err, idx) => (
                  <div key={idx} className="flex gap-1.5">
                    <span className="font-semibold shrink-0">Baris {err.row}:</span>
                    <span>{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-stroke pt-4 dark:border-dark-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!rows || !rows.length || isPending || !!parseError}
            loading={isPending}
          >
            Import {rows?.length ? `${rows.length} Data` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
