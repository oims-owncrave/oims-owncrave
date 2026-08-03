"use client";
import { isInStandaloneMode } from "@/lib/pwaUtils";

export default function PWASettingsSection() {
  const installed = typeof window !== "undefined" && isInStandaloneMode();
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900">Status Aplikasi</h3>
      <p className="mt-1 text-sm text-gray-500">
        {installed ? "✅ OIMS sudah terinstall" : "Belum diinstall — install dari browser untuk akses offline"}
      </p>
    </div>
  );
}
