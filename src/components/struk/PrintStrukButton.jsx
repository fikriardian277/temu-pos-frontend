import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import Struk from "./Struk";
import { Printer } from "lucide-react";

const PrintStrukButton = ({ transaksi }) => {
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef, // 👈 WAJIB di v3
    documentTitle: `struk-${transaksi?.kode_invoice || "transaksi"}`,
    removeAfterPrint: true,
  });

  if (!transaksi) return null;

  return (
    <div>
      {/* Elemen yang diprint */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <Struk ref={componentRef} transaksi={transaksi} />
      </div>

      {/* Tombol print */}
      <Button onClick={handlePrint} variant="outline" className="w-full">
        <Printer className="mr-2 h-4 w-4" />
        Cetak Struk
      </Button>
    </div>
  );
};

export default PrintStrukButton;
