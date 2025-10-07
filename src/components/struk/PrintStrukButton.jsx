import React from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import { Printer } from "lucide-react";

// [FIX] Komponen ini sekarang hanya menerima 'ref' dan menjadi tombol pemicu.
function PrintStrukButton({ componentRef }) {
  // [FIX] Gunakan hook useReactToPrint dengan sintaks modern.
  // 'content' adalah fungsi yang mengembalikan referensi ke elemen yang akan dicetak.
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "struk-transaksi",
    removeAfterPrint: true,
  });

  return (
    <Button onClick={handlePrint} variant="outline" className="w-full">
      <Printer className="mr-2 h-4 w-4" />
      Cetak Struk
    </Button>
  );
}

export default PrintStrukButton;
