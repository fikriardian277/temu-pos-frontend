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
        /* 1. Atur halaman print (biarin) */
        @page { size: 58mm auto; margin: 0 !important; }
        /* 2. Reset body (biarin) */
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          margin-bottom: 20px !important; /* Tambah jarak 10px di bawah */
        }

        /* --- STYLING KHUSUS STRUK --- */

        /* 3. Container Struk Utama (REVISI: Font Size 13px) */
        .struk-container {
          padding-top: 5px !important;
          padding-bottom: 5px !important;
          background-color: white; color: black;
          
          /* === GANTI FONT === */
          font-family: "Arial Narrow", Arial, sans-serif !important; 
          font-size: 13px !important; /* Naikin lagi jadi 13px */
          /* === SELESAI === */

          width: 220px; margin-left: auto; margin-right: auto;
          padding-left: 1px; /* Padding default tipis */
          padding-right: 1px;
          line-height: 1.3; /* Tetap 1.3 */
        }

        /* --- REVISI KHUSUS HOTEL --- */
        /* Target kalo ada class .hotel-struk */
        .hotel-struk {
          padding-left: 0 !important;
          padding-right: 0 !important;
          /* Font size dasar hotel udah ngikut 13px */
        }
        /* Item hotel ukurannya ngikut font dasar hotel (13px) */
        .hotel-struk .item-name,
        .hotel-struk .item-qty,
        .hotel-struk .item-price {
            font-size: 13px !important; /* Pastikan konsisten 13px */
        }
        /* --- AKHIR REVISI KHUSUS HOTEL --- */


        /* Style Reguler: Nama Item */
        /* Biarkan kosong, ngikut 13px */
        .struk-container:not(.hotel-struk) .struk-items-list > div > p.font-semibold {
           /* Kosong */
        }

        /* --- STYLING UMUM LAINNYA (Biarkan/Sesuaikan) --- */
        .item-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 2px 0; align-items: center; }
        .item-name { flex-grow: 1; padding-right: 4px; word-break: break-word; }
        .item-qty { width: 30px; text-align: center; flex-shrink: 0; }
        .item-price { width: 55px; text-align: right; flex-shrink: 0; padding-left: 4px; }
        .total-row { display: flex; justify-content: space-between; }
        .signature-box { margin-top: 20px; display: flex; justify-content: space-between; text-align: center; font-size: 11px; min-height: 50px; } /* Naikkin font TTD jadi 11px */
        .signature-col { width: 45%; display: flex; flex-direction: column; justify-content: space-between; }
        .signature-col p:last-child { margin-top: 15px; }
        hr.border-dashed { margin-top: 4px; margin-bottom: 4px; }

      `}</style>

      {/* Render komponen Struk-nya */}
      <Struk ref={strukRef} transaksi={transaksi} pengaturan={pengaturan} />
    </>
  );
}

export default PrintPage;
