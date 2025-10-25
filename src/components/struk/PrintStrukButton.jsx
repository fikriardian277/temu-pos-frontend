// src/components/struk/PrintStrukButton.jsx (VERSI AWAL YANG PRINT ASLINYA JALAN)

import React from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import { Printer } from "lucide-react";
import { toast } from "sonner"; // <-- Pastikan ini di-import

function PrintStrukButton({ componentRef, disabled }) {
  const handlePrint = useReactToPrint({
    // VVV INI KODE ASLI LU YANG JALAN (meski sintaksnya aneh) VVV
    contentRef: componentRef,
    // ^^^ KITA TETAP PAKAI INI ^^^
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        // Jeda 250ms (kasih waktu browser ngerender 'display: block')
        setTimeout(() => {
          console.log(
            "onBeforeGetContent: Jeda 250ms selesai, ambil konten..."
          );
          resolve();
        }, 250); // Coba 250ms, bisa dinaikin (misal 500) kalau masih gagal
      });
    },
    onAfterPrint: () => {
      console.log("Selesai print");
      // ... (timeout kamu) ...
    },
    documentTitle: "struk-transaksi",
    removeAfterPrint: false,
    onPrintError: (error) => {
      console.error("REACT-TO-PRINT ERROR:", error);
      toast.error("Gagal menyiapkan print. Coba lagi.");
    },
  });

  // Bagian return (tombol) ini juga UDAH BENER
  return (
    <Button
      onClick={() => {
        // Cek dulu ref-nya ada DAN isinya gak kosong
        if (componentRef?.current && componentRef.current.innerHTML !== "") {
          handlePrint(); // <-- Panggil fungsi print
        } else {
          // Kasih feedback kalo emang gak ada isinya
          console.error(
            "Referensi komponen struk tidak ditemukan atau belum siap!"
          );
          toast.error("Struk belum siap dicetak, coba sesaat lagi.");
        }
      }}
      variant="outline"
      className="w-full"
      disabled={disabled} // <-- Prop 'disabled' dari KasirPage
    >
      <Printer className="mr-2 h-4 w-4" />
      Cetak Struk
    </Button>
  );
}

export default PrintStrukButton;
