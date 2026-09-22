import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DIAGRAM_ALUR } from "../_diagram";

/**
 * Diagram hidup di dua tempat: dokumen (dibaca saat menelusuri kode) dan berkas
 * ini (dilihat klien). Keduanya gampang menyimpang tanpa ada yang sadar — itu
 * yang terjadi pada dokumen ini sebelumnya, basi empat hari tanpa ketahuan.
 */
describe("diagram alur", () => {
  it("sama dengan blok mermaid di docs/alur-menu-flowchart.md", () => {
    const md = readFileSync("docs/alur-menu-flowchart.md", "utf8");
    const blok = md.match(/```mermaid\n([\s\S]*?)```/);
    expect(blok, "blok ```mermaid tidak ditemukan di dokumen").not.toBeNull();

    const normal = (s: string) =>
      s
        .trim()
        .split("\n")
        .map((b) => b.trimEnd())
        .join("\n");

    // Dokumen memberi keterangan role di judul subgraph; aplikasi tidak — itu
    // satu-satunya selisih yang boleh ada, jadi dibandingkan tanpa judul subgraph.
    const tanpaJudul = (s: string) => normal(s).replace(/subgraph \w+\[".*?"\]/g, "subgraph");

    expect(tanpaJudul(DIAGRAM_ALUR)).toBe(tanpaJudul(blok![1]));
  });

  // Salah ketik di diagram tidak terbaca tsc — gagalnya baru muncul di layar klien.
  it("bisa diurai mermaid", async () => {
    const { default: mermaid } = await import("mermaid");
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
    await expect(mermaid.parse(DIAGRAM_ALUR)).resolves.toBeTruthy();
  });
});
