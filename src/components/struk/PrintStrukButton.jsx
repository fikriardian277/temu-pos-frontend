// src/components/struk/PrintStrukButton.jsx (FIX: use onBeforeGetContent -> return Promise)
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

    // PENTING: onBeforeGetContent harus mengembalikan Promise
    onBeforeGetContent: () =>
      new Promise((resolve) => {
        try {
          // sembunyikan semua elemen selain #struk-print-area
          const children = Array.from(document.body.children);
          children.forEach((el) => {
            if (el.id !== "struk-print-area") {
              el.classList.add("hide-during-print");
            }
          });

          // beri waktu singkat supaya DOM paint (500ms cukup)
          // kalau struk sudah siap lebih cepat, bisa reduce delay
          setTimeout(() => {
            resolve();
          }, 120); // 120ms biasanya cukup; bisa disesuaikan
        } catch (e) {
          // jika error, resolve agar print tidak terblokir
          console.error("onBeforeGetContent error:", e);
          resolve();
        }
      }),

    // kembalikan DOM setelah selesai print
    onAfterPrint: () => {
      try {
        const hidden = document.querySelectorAll(".hide-during-print");
        hidden.forEach((el) => el.classList.remove("hide-during-print"));
      } catch (e) {
        console.error("onAfterPrint cleanup error:", e);
      }
    },

    // pageStyle untuk memaksa aturan di iframe print
    pageStyle: `
      @page { size: 58mm auto; margin: 0 !important; }
      body { margin: 0 !important; padding: 0 !important; background: none !important; }

      /* Hide everything by default inside iframe, then reveal #struk-print-area */
      body * { visibility: hidden !important; }
      #struk-print-area, #struk-print-area * { visibility: visible !important; }

      /* Make sure struk layout is static and visible */
      #struk-print-area {
        position: static !important;
        height: auto !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        overflow: visible !important;
        display: block !important;
      }

      /* Safety: ensure hidden class really removed from print */
      .hide-during-print { display: none !important; }
    `,

    onPrintError: (error) => {
      console.error("REACT-TO-PRINT ERROR:", error);
      toast.error("Gagal menyiapkan print. Coba lagi.");
      // restore jika terjadi error
      try {
        const hidden = document.querySelectorAll(".hide-during-print");
        hidden.forEach((el) => el.classList.remove("hide-during-print"));
      } catch (e) {
        console.error("cleanup after error failed", e);
      }
    },
  });

  return (
    <Button
      onClick={() => {
        if (!componentRef?.current || componentRef.current.innerHTML === "") {
          console.error("Ref struk kosong atau belum siap!");
          toast.error("Struk belum siap dicetak.");
          return;
        }
        // panggil print (handlePrint mengembalikan void/usual)
        try {
          const res = handlePrint();
          // handlePrint might or might not return a promise; no reliance on .then here
          // we rely on onBeforeGetContent / onAfterPrint lifecycle for DOM changes
        } catch (e) {
          console.error("invoke handlePrint error:", e);
          toast.error("Gagal memulai print.");
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
