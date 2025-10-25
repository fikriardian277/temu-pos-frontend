// src/components/struk/PrintStrukButton.jsx (VERSI KODE ASLI + JENDELA BARU)

import React from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/Button.jsx";
import { Printer } from "lucide-react";
import { toast } from "sonner";

function PrintStrukButton({ componentRef, disabled }) {
  const handlePrint = useReactToPrint({
    // VVV KEMBALIKAN KE KODE ASLI KAMU VVV
    // (Meskipun aneh, ini yang jalan di sistemmu)
    contentRef: componentRef,
    // ^^^ SELESAI ^^^

    // VVV TAMBAHKAN FUNGSI PRINT JENDELA BARU VVV
    print: (iframe) => {
      return new Promise((resolve) => {
        const printContent = componentRef.current;
        if (!printContent || printContent.innerHTML === "") {
          console.error("Referensi komponen struk kosong saat mau print.");
          toast.error("Struk belum siap dicetak.");
          resolve();
          return;
        }
        const printWindow = window.open("", "", "height=600,width=400");
        if (printWindow) {
          printWindow.document.write("<html><head><title>Cetak Struk</title>");
          Array.from(
            document.querySelectorAll('style, link[rel="stylesheet"]')
          ).forEach((style) => {
            printWindow.document.write(style.outerHTML);
          });
          printWindow.document.write("</head><body>");
          printWindow.document.write(printContent.innerHTML);
          printWindow.document.write("</body></html>");
          printWindow.document.close();
          setTimeout(() => {
            try {
              printWindow.focus();
              printWindow.print();
              printWindow.close();
            } catch (e) {
              console.error("Gagal print jendela baru:", e);
              toast.error("Gagal print. Pastikan popup diizinkan.");
              printWindow.close();
            } finally {
              resolve();
            }
          }, 300);
        } else {
          toast.error(
            "Gagal membuka jendela print. Mohon izinkan popup untuk situs ini."
          );
          resolve();
        }
      });
    },
    // ^^^ SELESAI FUNGSI PRINT ^^^

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

  // Bagian return (tombol) ini TIDAK DIUBAH SAMA SEKALI
  return (
    <Button
      onClick={() => {
        if (componentRef?.current && componentRef.current.innerHTML !== "") {
          handlePrint();
        } else {
          console.error("Ref struk tidak ditemukan atau kosong!");
          toast.error("Struk belum siap dicetak, coba sesaat lagi.");
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
