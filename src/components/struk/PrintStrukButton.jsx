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

    onBeforePrint: () => {
      // 🚀 1. Sembunyikan semua elemen di luar struk
      const allElements = document.body.children;
      for (let el of allElements) {
        if (el.id !== "struk-print-area") {
          el.classList.add("hide-during-print");
        }
      }
    },

    onAfterPrint: () => {
      // 🧹 2. Balikin semua elemen setelah print selesai
      const hidden = document.querySelectorAll(".hide-during-print");
      hidden.forEach((el) => el.classList.remove("hide-during-print"));
    },

    onPrintError: (error) => {
      console.error("REACT-TO-PRINT ERROR:", error);
      toast.error("Gagal menyiapkan print. Coba lagi.");
    },

    // 🧾 3. Style khusus print (buat kertas 58mm)
    pageStyle: `
      @page {
        size: 58mm auto;
        margin: 0 !important;
      }

      /* Pastikan struk aja yang kelihatan */
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: none !important;
      }

      #struk-print-area, #struk-print-area * {
        visibility: visible !important;
      }

      #struk-print-area {
        position: static !important;
        height: auto !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        overflow: visible !important;
      }

      /* 🚫 Pastikan yang di-hide gak ikut ke print */
      .hide-during-print {
        display: none !important;
      }
    `,
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
