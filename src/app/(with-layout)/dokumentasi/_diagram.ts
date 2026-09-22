/**
 * Sumber flowchart alur produksi (mermaid).
 *
 * SALINAN PERSIS dari blok ```mermaid di docs/alur-menu-flowchart.md.
 * Kalau alurnya berubah, ubah DUA-DUANYA — dokumen itu yang dibaca saat
 * menelusuri kode, berkas ini yang dilihat klien.
 */
export const DIAGRAM_ALUR = `flowchart TD
    subgraph P["📦 PERSEDIAAN — admin_gudang"]
        P1[Barang Masuk<br/>bahan dari supplier]
        P2[Stok Bahan<br/>gudang]
        P3[Barang Keluar<br/>bahan ke produksi]
        P1 --> P2 --> P3
    end

    subgraph PR["✂️ PRODUKSI — admin_produksi"]
        PR1[PO Produksi<br/>rencana: produk+warna+ukuran+qty]
        PR2[Permintaan Bahan<br/>hitung kebutuhan dari BOM]
        PR3[Cutting<br/>potong kain]
        PR4[Bundle<br/>ikat + label QR]
        PR1 --> PR2 --> PR3 --> PR4
    end

    subgraph V["🚚 VENDOR & GUDANG"]
        V1[Penugasan Jahit]
        V2[Pengiriman Vendor]
        V3[Surat Jalan]
        V4[Penerimaan Hasil]
        V1 --> V2 --> V3 --> V4
    end

    subgraph RB["↩️ RETUR & BIAYA"]
        V5{Ada masalah?}
        V6[Retur & Perbaikan]
        V7[Selisih & Kasus]
        V5 -->|ya, kualitas| V6
        V5 -->|ya, kuantitas| V7
    end

    V4 --> V5
    V6 --> V4

    subgraph S["🎨 SABLON & BORDIR — opsional"]
        S1[Pekerjaan Dekorasi]
        S2[Template Dekorasi]
        S2 -.pakai template.-> S1
    end

    subgraph Q["✅ QUALITY CONTROL"]
        Q1["Penerimaan QC<br/>+ tab Antrean QC"]
        Q3[Work Order QC]
        Q4[Pemeriksaan QC]
        Q5{Lolos grade?}
        Q1 --> Q3 --> Q4 --> Q5
    end

    subgraph RK["🔁 REWORK & KARANTINA"]
        Q6["Rework<br/>+ tab Re-QC"]
        Q8[Karantina Reject]
    end

    subgraph FG["📦 FINISHING & GUDANG"]
        Q9[Finishing]
        Q11[Stok Barang Jadi]
        Q9 --> Q11
    end

    Q5 -->|B: cacat ringan| Q6
    Q6 -->|Re-QC| Q5
    Q5 -->|C/Reject| Q8
    Q5 -->|A: sempurna| Q9

    PR2 -.trigger.-> P3
    P3 -.eksekusi.-> PR3
    PR4 --> V1
    V4 -.opsional.-> S1
    S1 --> Q1
    V4 -->|tanpa dekorasi| Q1`;
