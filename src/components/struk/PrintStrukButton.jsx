// src/components/struk/PrintStrukButton.jsx

import React from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import { Printer } from "lucide-react";
import { toast } from "sonner";

function PrintStrukButton({ componentRef, disabled }) {
  const handlePrint = useReactToPrint({
    // VVV 1. WAJIB BALIK KE contentRef VVV
    contentRef: componentRef, // VVV 2. MODIFIKASI onBeforeGetContent VVV

    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        const el = componentRef.current;
        if (el) {
          // Ini kuncinya: kita tambah class 'print-ready' secara paksa
          el.classList.add("print-ready");
          console.log("Menyiapkan struk: class 'print-ready' ditambahkan.");
        } // Kita tetep butuh jeda, biar browser sempet "mencerna" class baru ini

        setTimeout(() => {
          console.log("Jeda 300ms selesai, struk harusnya siap total.");
          resolve();
        }, 300); // <-- Tetap pake 300ms (atau 500ms)
      });
    }, // ^^^ SELESAI MODIFIKASI ^^^ // VVV 3. TAMBAHKAN onAfterPrint VVV
    onAfterPrint: () => {
      console.log("Selesai print, membersihkan class...");
      const el = componentRef.current;
      if (el) {
        // Ini buat ngebersihin, biar struknya sembunyi lagi
        el.classList.remove("print-ready");
      }
    }, // ^^^ SELESAI onAfterPrint ^^^
    documentTitle: "struk-transaksi",
    removeAfterPrint: false,
    onPrintError: (error) => {
      console.error("REACT-TO-PRINT ERROR:", error);
      toast.error("Gagal menyiapkan print. Coba lagi.");
    },
  }); // ... (return button-nya biarin, udah bener)

  return (
    <Button
      onClick={() => {
        if (componentRef?.current && componentRef.current.innerHTML !== "") {
          handlePrint();
        } else {
          console.error("Ref struk kosong!");
          toast.error("Struk belum siap dicetak.");
        }
      }}
      variant="outline"
      className="w-full"
      disabled={disabled}
    >
      <Printer className="mr-2 h-4 w-4" /> Cetak Struk{" "}
    </Button>
  );
}

export default PrintStrukButton;
