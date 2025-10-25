// src/components/struk/PrintStrukButton.jsx (VERSI AWAL)

import React from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import { Printer } from "lucide-react";
import { toast } from "sonner"; // <-- Pastikan ini di-import

function PrintStrukButton({ componentRef, disabled }) {
  const handlePrint = useReactToPrint({
    // Prop 'contentRef' (v2) diisi langsung
    contentRef: componentRef,

    onAfterPrint: () => {
      console.log("Selesai print");
    },
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
        // Pengecekan ref di onClick
        if (componentRef?.current && componentRef.current.innerHTML !== "") {
          handlePrint(); // <-- Panggil fungsi print
        } else {
          // Kasih feedback kalo emang gak ada isinya
          console.error(
            "Referensi komponen struk tidak ditemukan atau belum siap!"
          );
          toast.error("Struk belum siap dicetak, coba sesaat lagi.");
        }
      }}
      variant="outline"
      className="w-full"
      disabled={disabled} // <-- Prop 'disabled' dari KasirPage
    >
      <Printer className="mr-2 h-4 w-4" />
      Cetak Struk
    </Button>
  );
}

export default PrintStrukButton;
