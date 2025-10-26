// src/components/struk/PrintStrukButton.jsx (VERSI pageStyle FINAL)

import React from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import { Printer } from "lucide-react";
import { toast } from "sonner";

function PrintStrukButton({ componentRef, disabled }) {
  const handlePrint = useReactToPrint({
    // 1. TETAP PAKAI contentRef
    contentRef: componentRef,

    // 2. HAPUS bodyClass
    // bodyClass: "print-struk-body", // <-- HAPUS

    // 3. HAPUS SEMUA onBeforeGetContent / onAfterPrint

    // 4. TAMBAHKAN pageStyle DENGAN CSS "NUKLIR"
    pageStyle: `
      /* 1. Atur halaman */
      @page { 
        size: 58mm auto; 
        margin: 0 !important; 
      }
      
      /* 2. Reset body iframe */
      body {
        margin: 0 !important;
        padding: 0 !important;
      }

      /* 3. SENJATA NUKLIR: Sembunyikan SEMUA elemen */
      body * {
        display: none !important;
      }

      /* 4. PENGECUALIAN: "Hidupkan" HANYA struk & anak-anaknya */
      #struk-print-area,
      #struk-print-area * {
        display: block !important;
        visibility: visible !important;
      }

      /* 5. "Buka" div struk-nya (lawan h-0, opacity-0) */
      #struk-print-area {
        height: auto !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        position: static !important;
      }
    `,

    documentTitle: "struk-transaksi",
    removeAfterPrint: false,
    onPrintError: (error) => {
      console.error("REACT-TO-PRINT ERROR:", error);
      toast.error("Gagal menyiapkan print. Coba lagi.");
    },
  });

  // 5. Return button-nya (biarin, udah bener)
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
      disabled={disabled} // <-- JANGAN LUPA INI
    >
      <Printer className="mr-2 h-4 w-4" />
      Cetak Struk
    </Button>
  );
}

export default PrintStrukButton;
