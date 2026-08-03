"use client";
import { useState, useEffect } from "react";

export default function PWADebug() {
  const [info, setInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    setInfo({
      standalone: String(window.matchMedia("(display-mode: standalone)").matches),
      serviceWorker: String("serviceWorker" in navigator),
      online: String(navigator.onLine),
    });
  }, []);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <pre className="fixed bottom-4 right-4 z-50 rounded bg-black/80 p-3 text-xs text-green-400">
      {JSON.stringify(info, null, 2)}
    </pre>
  );
}
