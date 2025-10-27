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
        }

        /* --- STYLING KHUSUS STRUK --- */

        /* 3. Container Struk Utama (Balikin padding bawah kecil) */
        .struk-container {
          padding-top: 5px !important;
          padding-bottom: 5px !important; /* Balikin ke 5px */
          background-color: white; color: black;
          font-family: "Arial Narrow", Arial, sans-serif !important; 
          font-size: 13px !important; 
          width: 220px; margin-left: auto; margin-right: auto;
          padding-left: 1px; 
          padding-right: 1px;
          line-height: 1.3; 
          
          /* === JAGA-JAGA BIAR ::after GAK KACAU === */
          position: relative; 
          overflow: hidden; /* Balikin overflow hidden biar rapi */
        }

        /* VVV INI JURUS BARUNYA VVV */
        /* Tambah elemen palsu di akhir struk */
        .struk-container::after {
          content: ""; /* Wajib ada */
          display: block; /* Biar punya tinggi */
          height: 20px; /* Jarak yang lu mau (coba 20px) */
          width: 100%; /* Lebar penuh */
        }
        /* ^^^ SELESAI ^^^ */


        /* --- STYLING HOTEL & LAINNYA (Biarkan) --- */
        .hotel-struk { padding-left: 0 !important; padding-right: 0 !important; }
        .hotel-struk .item-name,
        .hotel-struk .item-qty,
        .hotel-struk .item-price { font-size: 13px !important; }
        
        .struk-container:not(.hotel-struk) .struk-items-list > div > p.font-semibold { /* Kosong */ }

        .item-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 2px 0; align-items: center; }
        .item-name { flex-grow: 1; padding-right: 4px; word-break: break-word; }
        .item-qty { width: 30px; text-align: center; flex-shrink: 0; }
        .item-price { width: 55px; text-align: right; flex-shrink: 0; padding-left: 4px; }
        .total-row { display: flex; justify-content: space-between; }
        .signature-box { margin-top: 20px; display: flex; justify-content: space-between; text-align: center; font-size: 11px; min-height: 50px; } 
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
