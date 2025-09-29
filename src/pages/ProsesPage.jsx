// src/pages/ProsesPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axiosInstance";

// Impor komponen-komponen shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WashingMachine, Check, PackageCheck } from "lucide-react";

// Komponen untuk satu kartu transaksi (di-styling ulang)
const TransaksiCard = ({ transaksi, onUpdateStatus, onSelesaikan }) => {
  const { status_proses, status_pembayaran } = transaksi;

  const getStatusVariant = () => {
    if (status_pembayaran === "Lunas") return "success";
    if (status_pembayaran === "Belum Lunas") return "warning";
    return "secondary";
  };

  return (
    <Card className="mb-4 shadow-md">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">
              {transaksi.Pelanggan?.nama || "N/A"}
            </CardTitle>
            <CardDescription className="text-xs">
              {transaksi.kode_invoice}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant()}>{status_pembayaran}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
        {transaksi.Pakets?.map((p, index) => (
          <p key={`${p.id || index}-${p.nama_paket}`} className="truncate">
            • {p.Layanan?.nama_layanan} - {p.nama_paket}
          </p>
        ))}
      </CardContent>
      <CardFooter className="p-4">
        {status_proses === "Diterima" && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onUpdateStatus(transaksi, "Proses Cuci")}
          >
            <WashingMachine className="mr-2 h-4 w-4" />
            Mulai Cuci
          </Button>
        )}
        {status_proses === "Proses Cuci" && (
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            onClick={() => onUpdateStatus(transaksi, "Siap Diambil")}
          >
            <PackageCheck className="mr-2 h-4 w-4" />
            Siap Diambil
          </Button>
        )}
        {status_proses === "Siap Diambil" && (
          <Button
            size="sm"
            variant="success"
            className="w-full"
            onClick={() => onSelesaikan(transaksi)}
          >
            <Check className="mr-2 h-4 w-4" />
            Selesaikan Order
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Komponen untuk satu kolom Kanban (di-styling ulang)
const KanbanColumn = ({
  title,
  transactions,
  onUpdateStatus,
  onSelesaikan,
}) => (
  <div className="flex-1">
    <div className="p-4 text-center sticky top-16 bg-background/80 backdrop-blur-sm z-10">
      <h2 className="font-bold text-lg">{title}</h2>
      <p className="text-sm text-muted-foreground">
        {transactions.length} order
      </p>
      <Separator className="mt-2" />
    </div>
    <div className="h-[calc(100vh-12rem)] overflow-y-auto px-4 pb-4">
      {transactions.map((tx) => (
        <TransaksiCard
          key={tx.id}
          transaksi={tx}
          onUpdateStatus={onUpdateStatus}
          onSelesaikan={onSelesaikan}
        />
      ))}
    </div>
  </div>
);

function ProsesPage() {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentTx, setCurrentTx] = useState(null);
  const [metodePembayaran, setMetodePembayaran] = useState("Cash");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/transaksi/aktif");
      setTransaksi(response.data);
    } catch (err) {
      setError("Gagal mengambil data transaksi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kirimNotifSiapDiambil = (tx) => {
    const pesan = `Halo ${tx.Pelanggan.nama}, cucian Anda dengan invoice *${tx.kode_invoice}* sudah SIAP DIAMBIL. Terima kasih!`;
    const nomorHP = tx.Pelanggan.nomor_hp.startsWith("0")
      ? "62" + tx.Pelanggan.nomor_hp.substring(1)
      : tx.Pelanggan.nomor_hp;
    window.open(
      `https://wa.me/${nomorHP}?text=${encodeURIComponent(pesan)}`,
      "_blank"
    );
  };

  const handleUpdateStatus = async (tx, newStatus) => {
    try {
      const { data } = await api.put(`/transaksi/${tx.id}/status`, {
        status: newStatus,
      });
      // Update data lokal dengan data terbaru dari server
      setTransaksi((prev) =>
        prev.map((t) => (t.id === tx.id ? { ...t, ...data.data } : t))
      );
      if (newStatus === "Siap Diambil") {
        kirimNotifSiapDiambil(tx);
      }
    } catch (error) {
      alert("Gagal mengupdate status.");
    }
  };

  const handleSelesaikan = (tx) => {
    if (tx.status_pembayaran === "Belum Lunas") {
      setCurrentTx(tx);
      setMetodePembayaran("Cash"); // Reset ke default
      setIsPaymentModalOpen(true);
    } else {
      handleUpdateStatus(tx, "Selesai").then(() => {
        // Hapus dari list setelah 500ms agar ada efek visual
        setTimeout(
          () => setTransaksi((prev) => prev.filter((t) => t.id !== tx.id)),
          500
        );
      });
    }
  };

  const handleFinalizePayment = async () => {
    if (!currentTx || !metodePembayaran) return;
    try {
      await api.put(`/transaksi/${currentTx.id}/status`, {
        status: "Selesai",
        metode_pembayaran: metodePembayaran,
      });
      setIsPaymentModalOpen(false);
      setCurrentTx(null);
      // Hapus dari list setelah 500ms
      setTimeout(
        () =>
          setTransaksi((prev) => prev.filter((tx) => tx.id !== currentTx.id)),
        500
      );
    } catch (error) {
      alert("Gagal menyelesaikan pembayaran.");
    }
  };

  const diterima = transaksi.filter((tx) => tx.status_proses === "Diterima");
  const prosesCuci = transaksi.filter(
    (tx) => tx.status_proses === "Proses Cuci"
  );
  const siapDiambil = transaksi.filter(
    (tx) => tx.status_proses === "Siap Diambil"
  );

  if (loading) return <p className="text-center">Memuat data order aktif...</p>;
  if (error) return <p className="text-center text-destructive">{error}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 px-4">Proses Cucian</h1>
      <div className="flex flex-col md:flex-row -mx-4">
        <KanbanColumn
          title="Diterima"
          transactions={diterima}
          onUpdateStatus={handleUpdateStatus}
          onSelesaikan={handleSelesaikan}
        />
        <Separator orientation="vertical" className="h-auto hidden md:block" />
        <KanbanColumn
          title="Proses Cuci"
          transactions={prosesCuci}
          onUpdateStatus={handleUpdateStatus}
          onSelesaikan={handleSelesaikan}
        />
        <Separator orientation="vertical" className="h-auto hidden md:block" />
        <KanbanColumn
          title="Siap Diambil"
          transactions={siapDiambil}
          onUpdateStatus={handleUpdateStatus}
          onSelesaikan={handleSelesaikan}
        />
      </div>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pelunasan Order</DialogTitle>
            <DialogDescription>
              Order ini belum lunas. Pilih metode pembayaran untuk
              menyelesaikan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="text-sm">
              <p>
                Invoice:{" "}
                <span className="font-mono">{currentTx?.kode_invoice}</span>
              </p>
              <p>
                Total:{" "}
                <span className="font-semibold">
                  Rp {currentTx?.grand_total.toLocaleString("id-ID")}
                </span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setMetodePembayaran("Cash")}
                variant={metodePembayaran === "Cash" ? "default" : "outline"}
              >
                Cash
              </Button>
              <Button
                onClick={() => setMetodePembayaran("QRIS")}
                variant={metodePembayaran === "QRIS" ? "default" : "outline"}
              >
                QRIS
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Batal
            </Button>
            <Button variant="success" onClick={handleFinalizePayment}>
              Konfirmasi & Selesaikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProsesPage;
