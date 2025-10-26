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
  useEffect(() => {
    // Fungsi ini akan jalan SETELAH dialog print ditutup (baik nge-print atau cancel)
    const handleAfterPrint = () => {
      console.log("Selesai print, menutup tab...");
      window.close(); // <-- Perintah nutup tab
    };

    // Pasang listener-nya
    window.addEventListener("afterprint", handleAfterPrint);

    // Bersih-bersih
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  if (!transaksi || !pengaturan) {
    return <p>Memuat data struk...</p>; // Tampilan loading
  }

  return (
    <>
      {/* Ini adalah CSS "Nuklir" yang kita pindah dari pageStyle.
        Ini WAJIB ada di sini buat ngatur layout struk. 
      */}
      <style>{`
        /* Atur halaman print */
        @page { 
          size: 58mm auto; 
          margin: 0 !important; 
        }
        
        /* Reset body halaman print ini */
        body {
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Style untuk komponen Struk (dari Struk.jsx lama) */
        .item-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 1px 0; align-items: center; }
        .item-name { flex-grow: 1; padding-right: 4px; word-break: break-word; }
        .item-qty { width: 30px; text-align: center; flex-shrink: 0; }
        .item-price { width: 55px; text-align: right; flex-shrink: 0; padding-left: 4px; }
        .total-row { display: flex; justify-content: space-between; }
        .signature-box { margin-top: 15px; display: flex; justify-content: space-between; text-align: center; font-size: 9px; }
        .signature-col { width: 45%; }
      `}</style>

      {/* Render komponen Struk-nya */}
      <Struk ref={strukRef} transaksi={transaksi} pengaturan={pengaturan} />
    </>
  );
}

export default PrintPage;
