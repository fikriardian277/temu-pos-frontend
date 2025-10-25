// src/components/struk/PrintStrukButton.jsx (VERSI FINAL & BENAR)

import React from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import { Printer } from "lucide-react";
import { toast } from "sonner"; // <-- Pastikan ini di-import

function PrintStrukButton({ componentRef, disabled }) {
  const handlePrint = useReactToPrint({
    // INI DIA CARA YANG BENAR UNTUK v3 (dan versi terbaru)
    // Kita kasih FUNGSI yang akan MENGAMBIL ref saat di-klik
    contentRef: componentRef,
    onAfterPrint: () => {
      console.log("Selesai print");
      // kalau mau reset atau sembunyiin area print, kasih delay
      setTimeout(() => {
        // misal kamu mau reset state
        // setShowStruk(false);
      }, 1000);
    },

    documentTitle: "struk-transaksi",
    removeAfterPrint: false,

    // Kita tambahin error handling biar jelas
    onPrintError: (error) => {
      console.error("REACT-TO-PRINT ERROR:", error);
      toast.error("Gagal menyiapkan print. Coba lagi.");
    },
  });

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
