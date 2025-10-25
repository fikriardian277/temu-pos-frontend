// src/components/struk/PrintStrukButton.jsx (VERSI FINAL, HANYA pageStyle)

import React from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import { Printer } from "lucide-react";
import { toast } from "sonner";

function PrintStrukButton({ componentRef, disabled }) {
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "struk-transaksi",
    removeAfterPrint: false,

    // HAPUS 'onBeforeGetContent'
    // HAPUS 'onAfterPrint'

    // pageStyle untuk memaksa aturan di iframe print
    pageStyle: `
      /* 1. Atur halaman */
      @page { size: 58mm auto; margin: 0 !important; }
      body { margin: 0 !important; padding: 0 !important; background: none !important; }

      /* 2. Sembunyikan SEMUA di iframe */
      body * { visibility: hidden !important; }

      /* 3. Tampilkan HANYA struk & isinya */
      #struk-print-area, #struk-print-area * { visibility: visible !important; }

      /* 4. "Buka" div struknya (lawan h-0, opacity-0) */
      #struk-print-area {
        position: static !important;
        height: auto !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        overflow: visible !important;
        display: block !important;
      }
      
      /* 5. HAPUS .hide-during-print (gak perlu) */
    `,

    onPrintError: (error) => {
      console.error("REACT-TO-PRINT ERROR:", error);
      toast.error("Gagal menyiapkan print. Coba lagi.");
    },
  });

  // Return button-nya (biarin, udah bener)
  return (
    <Button
      onClick={() => {
        if (!componentRef?.current || componentRef.current.innerHTML === "") {
          console.error("Ref struk kosong atau belum siap!");
          toast.error("Struk belum siap dicetak.");
          return;
        }
        try {
          handlePrint();
        } catch (e) {
          console.error("invoke handlePrint error:", e);
          toast.error("Gagal memulai print.");
        }
      }}
      variant="outline"
      className="w-full"
      disabled={disabled}
    >
      <Printer className="mr-2 h-4 w-4" />
      Cetak Struk
    </Button>
  );
}

export default PrintStrukButton;
