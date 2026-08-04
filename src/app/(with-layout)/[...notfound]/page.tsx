import { notFound } from "next/navigation";

/**
 * Catch-all untuk route dalam app shell yang belum punya page.tsx
 * (mis. menu ada tapi halaman belum dibangun). Trigger notFound() →
 * render (with-layout)/not-found.tsx DALAM layout (sidebar+header tetap).
 */
export default function CatchAllNotFound() {
  notFound();
}
