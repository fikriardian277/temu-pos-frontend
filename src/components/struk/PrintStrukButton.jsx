// src/components/struk/PrintStrukButton.jsx (VERSI bodyClass)

import React from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import { Printer } from "lucide-react";
import { toast } from "sonner";

function PrintStrukButton({ componentRef, disabled }) {
  const handlePrint = useReactToPrint({
    contentRef: componentRef, // <-- Tetap pake 'contentRef' // VVV Prop ini buat ngebenerin bug 'h-0' VVV

    bodyClass: "print-struk-body", // HAPUS SEMUA onBeforeGetContent / onAfterPrint

    documentTitle: "struk-transaksi",
    removeAfterPrint: false,
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
      disabled={disabled} // <-- PASTIKAN INI ADA
    >
      <Printer className="mr-2 h-4 w-4" /> Cetak Struk{" "}
    </Button>
  );
}

export default PrintStrukButton;
