// src/components/struk/PrintStrukButton.jsx (VERSI bodyClass)

import React from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import { Printer } from "lucide-react";
import { toast } from "sonner";

function PrintStrukButton({ componentRef, disabled }) {
  const handlePrint = useReactToPrint({
    // 1. TETAP PAKAI contentRef (karena versi lu wajib pake ini)
    contentRef: componentRef, // 2. TAMBAHKAN PROP INI // Ini akan nambah class 'print-struk-body' ke <body> // di JENDELA PRINT (iframe)

    bodyClass: "print-struk-body", // 3. HAPUS SEMUA JAVASCRIPT DELAY (PENTING!) // HAPUS onBeforeGetContent // HAPUS onAfterPrint

    documentTitle: "struk-transaksi",
    removeAfterPrint: false, // Biarin
    onPrintError: (error) => {
      console.error("REACT-TO-PRINT ERROR:", error);
      toast.error("Gagal menyiapkan print. Coba lagi.");
    },
  }); // 4. Return button-nya (biarin, udah bener)

  return (
    <Button
      onClick={() => {
        // Pengecekan ini tetep penting
        if (componentRef?.current && componentRef.current.innerHTML !== "") {
          handlePrint();
        } else {
          console.error("Ref struk kosong atau belum siap!");
          toast.error("Struk belum siap dicetak, coba sesaat lagi.");
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
