// src/components/struk/PrintStrukButton.jsx (VERSI bodyClass FINAL)

import React from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import { Printer } from "lucide-react";
import { toast } from "sonner";

function PrintStrukButton({ componentRef, disabled }) {
  const handlePrint = useReactToPrint({
    // 1. TETAP PAKAI contentRef
    contentRef: componentRef,

    // 2. WAJIB PAKAI bodyClass (Ini yang ngebenerin bug h-0)
    bodyClass: "print-struk-body",

    // 3. HAPUS SEMUA onBeforeGetContent / onAfterPrint
    // (onBeforeGetContent: () => { ... HAPUS ... })
    // (onAfterPrint: () => { ... HAPUS ... })

    documentTitle: "struk-transaksi",
    removeAfterPrint: false,
    onPrintError: (error) => {
      console.error("REACT-TO-PRINT ERROR:", error);
      toast.error("Gagal menyiapkan print. Coba lagi.");
    },
  });

  // 4. Return button-nya (biarin, udah bener)
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
