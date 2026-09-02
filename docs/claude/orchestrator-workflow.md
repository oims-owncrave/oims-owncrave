# Orchestrator Workflow — Eksekusi Gelombang di OIMS

> Adaptasi dari school-management (`docs/claude/orchestrator-workflow.md`). Konsep
> lengkap: `~/Documents/second-brain/1.Projects/system/applications/existing/sistem_eksekusi_issue_dengan_ai.md`.
> Pola OIMS: Claude Code = orchestrator + reviewer; eksekutor default = **Antigravity**
> (dari prompt file `docs/prompts/`), subagent Claude hanya untuk issue kecil tanpa plan.

## Kapan pakai mode gelombang

| Kondisi | Keputusan |
|---|---|
| Batch ≥3 issue dalam 1 sesi | ✅ Mode gelombang (dashboard → sesi) |
| 1-2 issue kecil | ❌ Kerjakan langsung / `/oims-review` biasa |
| Issue butuh judgment/desain berat | ❌ Sesi sendiri, orchestrator kerjakan inline |
| Issue spec jelas (ada plan file + prompt) | ✅ Antigravity |

## Trade-off (jangan salah jual)

- **Context utama awet** — itu nilai utamanya, BUKAN hemat token (total token justru naik).
- Model di Antigravity pilih yang murah (Gemini Flash High). Hasil kurang = plan kurang
  detail, bukan model kurang pintar.

## Kapan sesi BERHENTI

**Default: satu sesi = SATU gelombang.** Selesai → tutup, lanjut sesi baru.

Berhenti LEBIH AWAL kalau kena salah satu:

| Pemicu | Kenapa |
|---|---|
| ~6 issue sudah tersentuh di sesi ini | Context penuh → review dangkal → bug lolos |
| 2 batch eksekutor sudah direview | Konteks diff menumpuk di orchestrator |
| Ada mutasi DB produksi / deploy | Aksi berisiko = penutup sesi, biar user smoke test |
| Temuan besar yang mengubah rencana | Butuh keputusan user, bukan lanjut otomatis |
| User menyebut token/biaya/durasi | Sinyal keras, tutup rapi |

**BUKAN alasan lanjut:** "masih ada issue tersisa", "user bilang gas semua", "issue
berikutnya kecil". Orchestrator tak bisa lihat sisa context — pakai penghitung di atas,
usulkan tutup sesi sendiri tanpa diminta.

**Saat menawarkan opsi di awal sesi:** tawarkan cakupan SATU gelombang saja.

## Alur per gelombang (OIMS)

1. **Awal sesi:** minta grant user — (a) boleh commit per issue, (b) mulai dari mana.
2. `bd show <id>` + plan file di `docs/plans/` + prompt di `docs/prompts/`.
3. **Triage per issue:** perlu plan file? (≥3 file / keputusan desain / bentuk belum
   jelas → ya, buat via `/oims-plan` dulu). Spec jelas → Antigravity. Kecil tanpa plan →
   subagent/inline.
4. **Eksekusi Antigravity:** user jalankan prompt di Antigravity → hasil berhenti di
   **staged changes** (tidak commit).
5. **Review = `/oims-review`:** baca issue → `git diff --staged` → fix (muncul sebagai
   unstaged = batas kontribusi terlihat) → verifikasi type-check/build.
6. **Commit PER ISSUE** (setelah approve/grant), bukan per batch.
7. `bd close <id>`.
8. **Tutup sesi:** update `docs/dashboard.md` (coret yang closed, isi Changelog),
   regenerate `python3 tools/dashboard/generate.py`, update roadmap kalau milestone,
   laporkan pending + handoff.
9. **Trigger breakdown tahap berikutnya (WAJIB cek tiap tutup sesi):** kalau issue
   eksekusi tahap berjalan tersisa ≤2 (atau semua closed), tambahkan baris sesi
   `<epic-id> plan-breakdown-tahap<N+1>` ke gelombang antrean di dashboard.md —
   prompt sesi planning tahap berikutnya jadi tersedia tepat waktu, tidak lebih awal
   (basi) dan tidak kelupaan. Urutan epic: oims-eba (Tahap 3) → oims-ckp (Tahap 4).

## Aturan paralelisme (kalau pakai subagent)

- Max 2 agent bersamaan; scope file tidak boleh overlap (sebut eksplisit di brief).
- Orchestrator SATU-SATUNYA yang pegang git.
- Quirk RTK: Read/Edit hook bisa gagal → `rtk proxy python3` byte-mode (`rb`/`wb`).

## Yang tetap di orchestrator (jangan didelegasi)

- Review + commit + bead lifecycle + laporan progres.
- Mutasi DB Supabase produksi (siapkan SQL, apply tunggu konfirmasi user).
- Keputusan "tidak difix" (bug tanpa bukti di kode → jangan nebak).
- Aturan proyek yang eksekutor sering langgar: stok immutable via `mutasi_stok`,
  soft delete + partial unique index, audit log tiap CREATE/UPDATE/APPROVE, numeric
  untuk uang/kuantitas — cek ini SELALU saat review.

## Hasil yang diharapkan per sesi

Commit rapi per issue · bead closed · dashboard.md ter-update + regenerate ·
handoff jelas (apa pending, butuh apa dari user).
