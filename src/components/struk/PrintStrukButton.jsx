// src/components/struk/PrintStrukButton.jsx (VERSI PAKAI JS CLASS)

import React from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import { Printer } from "lucide-react";
import { toast } from "sonner";

function PrintStrukButton({ componentRef, disabled }) {
  const handlePrint = useReactToPrint({
    // 1. WAJIB TETAP PAKE contentRef
    contentRef: componentRef, // 2. MODIFIKASI onBeforeGetContent

    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        const el = componentRef.current;
        if (el) {
          // TAMBAH CLASS SECARA PAKSA
          el.classList.add("print-ready");
          console.log("Menyiapkan struk: class 'print-ready' ditambahkan.");
        } // TETAP KASIH JEDA

        setTimeout(() => {
          console.log("Jeda 300ms selesai, struk harusnya siap total.");
          resolve();
        }, 300); // <-- Coba 300ms atau 500ms
      });
    }, // 3. TAMBAHKAN onAfterPrint (PENTING!)

    onAfterPrint: () => {
      console.log("Selesai print, membersihkan class...");
      const el = componentRef.current;
      if (el) {
        // HAPUS CLASS-nya lagi biar sembunyi
        el.classList.remove("print-ready");
      }
    },

    documentTitle: "struk-transaksi",
    removeAfterPrint: false,
    onPrintError: (error) => {
      console.error("REACT-TO-PRINT ERROR:", error);
      toast.error("Gagal menyiapkan print. Coba lagi.");
    },
  }); // 4. Return button-nya (biarin, udah bener)

  return (
    <Button
      onClick={() => {
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
