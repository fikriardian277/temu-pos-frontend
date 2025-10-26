// src/pages/PrintPage.jsx (FILE BARU)

import React, { useEffect, useState } from "react";
import Struk from "../components/struk/Struk"; // Sesuaikan path jika perlu

function PrintPage() {
  const [transaksi, setTransaksi] = useState(null);
  const [pengaturan, setPengaturan] = useState(null);
  const strukRef = React.useRef(); // Ref untuk Struk

  useEffect(() => {
    // 1. Ambil data yang disimpan dari KasirPage
    const dataStruk = sessionStorage.getItem("dataStrukToPrint");

    if (dataStruk) {
      try {
        const { detailTransaksiSukses, authStatePengaturan } =
          JSON.parse(dataStruk);

        setTransaksi(detailTransaksiSukses);
        setPengaturan(authStatePengaturan);

        // 2. Beri jeda SANGAT SINGKAT (100ms) agar Struk sempet render
        const timer = setTimeout(() => {
          // 3. Panggil Print Dialog
          window.print();
        }, 100);

        return () => clearTimeout(timer);
      } catch (e) {
        console.error("Gagal parse data struk:", e);
        alert("Gagal memuat data struk.");
      }
    } else {
      alert("Data struk tidak ditemukan.");
    }
  }, []);

  if (!transaksi || !pengaturan) {
    return <p>Memuat data struk...</p>; // Tampilan loading
  }

  return (
    <>
      <style>{`
        /* 1. Atur halaman print */
        @page {
          size: 58mm auto;
          margin: 0 !important;
        }

        /* 2. Reset body halaman print */
        body {
          margin: 0 !important;
          padding: 0 !important;
        }

        /* --- STYLING KHUSUS STRUK --- */

        /* 3. Container Struk Utama (REVISI: Tambah padding atas/bawah) */
        .struk-container { /* Ganti target ke class container jika ada, atau tambahkan class ini ke div utama di Struk.jsx */
          padding-top: 5px !important; /* Tambah padding atas */
          padding-bottom: 5px !important; /* Tambah padding bawah */
          /* Style asli: */
          background-color: white;
          color: black;
          font-family: monospace;
          font-size: 11px;
          width: 220px;
          margin-left: auto;
          margin-right: auto;
          
          padding-right: 1px;
          line-height: 1.2; /* Sedikit renggangin antar baris */
        }

        /* Style Hotel: Baris Item */
        .item-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px dashed #ccc;
          padding: 2px 0; /* Sedikit padding atas/bawah di item row */
          align-items: center;
        }
        /* Style Hotel: Nama Item (REVISI: Font size) */
        .item-name {
          flex-grow: 1;
          padding-right: 4px;
          word-break: break-word;
          font-size: 10px; /* Perkecil sedikit biar gak terlalu nabrak */
          /* font-weight: 600; */ /* Optional: Bikin semi-bold kalo mau */
        }
        .item-qty {
          width: 30px;
          text-align: center;
          flex-shrink: 0;
          font-size: 10px; /* Samain font-size item */
        }
        .item-price {
          width: 55px;
          text-align: right;
          flex-shrink: 0;
          padding-left: 4px;
          font-size: 10px; /* Samain font-size item */
        }

        /* Style Reguler: Nama Item (REVISI: Font size) */
        /* Kita target <p> yang ada di dalam div item reguler */
        .struk-items-list > div > p.font-semibold {
           font-size: 12px !important; /* Perbesar sedikit */
           /* font-weight: 600; */ /* Optional: Bikin semi-bold */
        }


        /* Style Total & Signature */
        .total-row {
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          margin-top: 20px; /* Tambah jarak atas */
          display: flex;
          justify-content: space-between;
          text-align: center;
          font-size: 9px;
          min-height: 50px; /* REVISI: Tambah tinggi minimal area TTD */
        }
        .signature-col {
          width: 45%;
          display: flex; /* REVISI: Pake flexbox biar gampang ngatur jarak */
          flex-direction: column;
          justify-content: space-between; /* REVISI: Dorong teks ke atas & titik2 ke bawah */
        }
        .signature-col p:last-child { /* REVISI: Target titik-titik */
          margin-top: 15px; /* Kasih jarak antara teks & titik2 */
        }

        /* Garis pemisah */
        hr.border-dashed {
           margin-top: 4px;
           margin-bottom: 4px;
        }

      `}</style>

      {/* Render komponen Struk-nya */}
      {/* Pastikan div utama di Struk.jsx punya className="struk-container" */}
      <Struk ref={strukRef} transaksi={transaksi} pengaturan={pengaturan} />
    </>
  );
}

export default PrintPage;
