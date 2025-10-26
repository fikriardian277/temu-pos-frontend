// src/components/struk/PrintStrukButton.jsx (VERSI PORTAL + JS)

import React from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import { Printer } from "lucide-react";
import { toast } from "sonner";

// Ini class CSS yang akan kita pake
const PRINT_READY_CLASS = "print-ready";
const HIDE_DURING_PRINT_CLASS = "hide-during-print";

function PrintStrukButton({ componentRef, disabled }) {
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "struk-transaksi",
    removeAfterPrint: false,

    // HAPUS pageStyle
    // HAPUS bodyClass

    // KITA PAKAI INI
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        // 1. "Buka" div struk-nya (lawan h-0, opacity-0)
        const strukEl = componentRef.current;
        if (strukEl) {
          strukEl.classList.add(PRINT_READY_CLASS);
        }

        // 2. Sembunyikan SEMUA elemen lain
        const children = Array.from(document.body.children);
        children.forEach((el) => {
          // Sembunyikan semua KECUALI 'print-portal'
          if (el.id !== "print-portal") {
            el.classList.add(HIDE_DURING_PRINT_CLASS);
          }
        });

        // 3. Kasih jeda 300ms
        // Ini WAJIB biar browser (dan Spooler) sempet ngebaca class baru
        setTimeout(resolve, 300);
      });
    },

    // Ini buat bersih-bersih
    onAfterPrint: () => {
      componentRef.current?.classList.remove(PRINT_READY_CLASS);
      document
        .querySelectorAll("." + HIDE_DURING_PRINT_CLASS)
        .forEach((el) => el.classList.remove(HIDE_DURING_PRINT_CLASS));
    },

    onPrintError: (error) => {
      // Bersih-bersih juga kalo error
      componentRef.current?.classList.remove(PRINT_READY_CLASS);
      document
        .querySelectorAll("." + HIDE_DURING_PRINT_CLASS)
        .forEach((el) => el.classList.remove(HIDE_DURING_PRINT_CLASS));

      console.error("REACT-TO-PRINT ERROR:", error);
      toast.error("Gagal menyiapkan print. Coba lagi.");
    },
  });

  // ... (return button-nya biarin, udah bener)
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
