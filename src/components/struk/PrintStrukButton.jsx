// ✅ src/components/struk/PrintStrukButton.jsx (FINAL FIX)
import React from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import { Printer } from "lucide-react";
import { toast } from "sonner";

function PrintStrukButton({ componentRef, disabled }) {
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    bodyClass: "print-struk-body",
    documentTitle: "struk-transaksi",
    removeAfterPrint: false,

    // --- ini tambahan penting ---
    pageStyle: `
      @page { size: 58mm auto; margin: 0 !important; }

      /* SEMUA elemen disembunyikan */
      body * {
        visibility: hidden !important;
      }

      /* TAPI area struk tetap kelihatan */
      #struk-print-area, #struk-print-area * {
        visibility: visible !important;
      }

      /* Pastikan area struk tampil normal */
      #struk-print-area {
        position: static !important;
        height: auto !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        overflow: visible !important;
      }
    `,

    onPrintError: (error) => {
      console.error("REACT-TO-PRINT ERROR:", error);
      toast.error("Gagal menyiapkan print. Coba lagi.");
    },
  });

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
      <Printer className="mr-2 h-4 w-4" />
      Cetak Struk
    </Button>
  );
}

export default PrintStrukButton;
