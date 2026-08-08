CONTEXT:
Saya mengerjakan OIMS Owncrave — ERP produksi garmen, Next.js 16 + React 19 + TS strict, Tailwind v4, dark mode aktif. Stack: Supabase, TanStack Query, Zustand, PWA manual.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules.

TASK:
Implementasi splash screen PWA di OIMS Owncrave.

ISSUE: oims-ghs (feature, P3) — Mobile UI Polish batch.
BRANCH: feat/oims-ghs-splash-screen

REQUIREMENTS:

**Tujuan:** Saat app pertama dibuka (cold load / PWA standalone), tampilkan splash screen overlay — logo + nama app + 3 titik loading animasi. Fade out otomatis setelah hydration. Mirip school-management (lihat screenshot referensi: logo di tengah, nama app, tagline, 3 dots).

**Task 1 — SplashScreen component (inline di PWA/index.tsx):**
- Tambah fungsi `SplashScreen` di `src/components/PWA/index.tsx` (tidak perlu file baru)
- Layout: `fixed inset-0 z-[9999] flex flex-col items-center justify-center` 
- Background: `bg-linear-to-b from-[#1a56db] to-[#1e40af]` (biru primer gradient ke bawah, dark biru)
- Isi tengah:
  - Logo: `<img src="/icons/icon-192.png" alt="OIMS" className="w-24 h-24 rounded-[22px] shadow-lg mb-6" />`
  - Nama: `<h1 className="text-white text-2xl font-bold mb-1">OIMS Owncrave</h1>`
  - Tagline: `<p className="text-white/70 text-sm mb-10">Owncrave Integrated Management</p>`
  - Dots: 3 elemen `<span>` bulat `w-3 h-3 rounded-full bg-white` dengan `animate-bounce` staggered
- Dots markup:
  ```tsx
  <div className="flex items-center gap-2">
    <span className="w-3 h-3 rounded-full bg-white animate-bounce [animation-delay:0ms]" />
    <span className="w-3 h-3 rounded-full bg-white animate-bounce [animation-delay:150ms]" />
    <span className="w-3 h-3 rounded-full bg-white animate-bounce [animation-delay:300ms]" />
  </div>
  ```
- Fade out: tambah class `transition-opacity duration-500` + `opacity-0` saat hiding

**Task 2 — Integrasi di PWAComponents:**
- Tambah state: `const [showSplash, setShowSplash] = useState(true)`
- Tambah state: `const [splashFading, setSplashFading] = useState(false)`
- Di `useEffect` yang sudah ada (setelah register SW & semua listener siap), tambahkan timer:
  ```tsx
  // Fade out splash after 1.2s
  const timer = setTimeout(() => {
    setSplashFading(true)
    setTimeout(() => setShowSplash(false), 500) // tunggu fade selesai
  }, 1200)
  return () => clearTimeout(timer)
  ```
- Render splash SEBELUM return null / offline banner:
  ```tsx
  if (showSplash) {
    return <SplashScreen fading={splashFading} />
  }
  ```
- `SplashScreen` terima prop `fading: boolean` → apply `opacity-0` class saat fading

**Task 3 — Pastikan tidak block halaman:**
- Splash adalah overlay di atas `{children}` layout — BUKAN menggantikan children
- PWAComponents di-render di `src/app/layout.tsx` sebagai sibling — posisinya `fixed inset-0` jadi overlay
- Tidak perlu ubah layout.tsx

CONSTRAINTS:
- Jangan install dependency baru
- Tailwind v4: `bg-linear-to-b` (BUKAN `bg-gradient-to-b`)
- Arbitrary values boleh untuk warna splash (bukan design system color)
- Logo path: `/icons/icon-192.png` (sudah ada di `public/icons/`)
- Setelah: `pnpm run type-check` + `pnpm run build` clean

OUTPUT per task: "✅ complete: [ringkasan]"
JANGAN commit (tunggu Abu review).

Mulai Task 1.
