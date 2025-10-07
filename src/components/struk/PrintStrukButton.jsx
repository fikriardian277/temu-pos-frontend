import React from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import { Printer } from "lucide-react";

// [FIX] Komponen ini sekarang hanya menerima 'ref' dan menjadi tombol pemicu.
function PrintStrukButton({ componentRef }) {
  const handlePrint = useReactToPrint({
    contentRef: componentRef, // ✅ versi 3.x
    documentTitle: "struk-transaksi",
    removeAfterPrint: true,
  });

  return (
    <Button
      onClick={() => {
        if (componentRef?.current) handlePrint();
        else console.error("⚠️ Struk belum siap untuk dicetak!");
      }}
      variant="outline"
      className="w-full"
    >
      <Printer className="mr-2 h-4 w-4" />
      Cetak Struk
    </Button>
  );
}

export default PrintStrukButton;
