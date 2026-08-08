# Plan: oims-ghs — Splash Screen PWA Mobile

## Context

Saat app pertama dibuka (cold load / PWA standalone), tidak ada visual loading — langsung blank/putih sebentar sebelum halaman muncul. Owner minta splash screen seperti school-management: logo + nama app + 3 titik loading animasi. Ini murni UX polish, tidak ada perubahan schema/server action.

## Files

- `src/components/PWA/index.tsx` — satu-satunya file yang diubah

## Task 1 — Tambah SplashScreen component

Di `src/components/PWA/index.tsx`, tambah fungsi `SplashScreen` sebelum `PWAComponents`:

```tsx
function SplashScreen({ fading }: { fading: boolean }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-linear-to-b from-[#1a56db] to-[#1e40af] transition-opacity duration-500",
        fading && "opacity-0"
      )}
    >
      <img
        src="/icons/icon-192.png"
        alt="OIMS"
        className="mb-6 h-24 w-24 rounded-[22px] shadow-lg"
      />
      <h1 className="mb-1 text-2xl font-bold text-white">OIMS Owncrave</h1>
      <p className="mb-10 text-sm text-white/70">Owncrave Integrated Management</p>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 animate-bounce rounded-full bg-white [animation-delay:0ms]" />
        <span className="h-3 w-3 animate-bounce rounded-full bg-white [animation-delay:150ms]" />
        <span className="h-3 w-3 animate-bounce rounded-full bg-white [animation-delay:300ms]" />
      </div>
    </div>
  )
}
```

Import `cn` dari `@/lib/utils` (sudah dipakai di project).

## Task 2 — Integrasi di PWAComponents

Tambah 2 state di `PWAComponents`:

```tsx
const [showSplash, setShowSplash] = useState(true)
const [splashFading, setSplashFading] = useState(false)
```

Di `useEffect` yang sudah ada (setelah semua listener siap), tambah timer fade-out:

```tsx
const splashTimer = setTimeout(() => {
  setSplashFading(true)
  setTimeout(() => setShowSplash(false), 500)
}, 1200)
// tambahkan ke cleanup return yang sudah ada, atau buat return baru:
// return () => clearTimeout(splashTimer)
```

Render splash sebelum `if (!isOnline)` check:

```tsx
if (showSplash) {
  return <SplashScreen fading={splashFading} />
}

if (!isOnline) { ... }
```

## Task 3 — Verifikasi

- Cold load app → splash muncul ~1.2 detik → fade out → halaman login/dashboard tampil
- Splash tidak block render children (PWAComponents adalah sibling di layout, bukan wrapper)
- Dark mode: splash selalu biru (branding), tidak perlu dark variant
- `pnpm run type-check` clean
- `pnpm run build` clean

## CLAUDE.md Check
- [ ] Pattern baru? Tidak — SplashScreen inline di PWA component
- [ ] Tabel baru? Tidak
- [ ] Route baru? Tidak
- [ ] Permission pattern baru? Tidak
