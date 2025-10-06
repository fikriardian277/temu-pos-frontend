// src/pages/ProsesPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axiosInstance";
import { toast } from "sonner";

// Impor komponen
import { Button } from "@/components/ui/Button.jsx";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import {
  WashingMachine,
  Check,
  PackageCheck,
  Truck,
  ArrowRight,
  ClipboardList,
} from "lucide-react"; // Impor ikon baru

import EmptyState from "@/components/ui/EmptyState.jsx";

// Komponen kartu transaksi (di-upgrade dengan logika baru)
const TransaksiCard = ({ transaksi, onUpdateStatus, onSelesaikan }) => {
  const { status_proses, status_pembayaran, tipe_layanan } = transaksi;

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
        {transaksi.Pakets?.map((p) => (
          <p key={p.id} className="truncate">
            • {p.Layanan.nama_layanan} - {p.nama_paket}
          </p>
        ))}
      </CardContent>
      <CardFooter className="p-4">
        {/* [LOGIC] Tombol-tombol aksi sekarang lebih pintar */}
        {status_proses === "Menunggu Penjemputan" && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onUpdateStatus(transaksi, "Diterima")}
          >
            <ArrowRight className="mr-2 h-4 w-4" /> Konfirmasi Diterima
          </Button>
        )}
        {status_proses === "Diterima" && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onUpdateStatus(transaksi, "Proses Cuci")}
          >
            <WashingMachine className="mr-2 h-4 w-4" /> Mulai Cuci
          </Button>
        )}
        {status_proses === "Proses Cuci" && (
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            onClick={() => onUpdateStatus(transaksi, "Siap Diambil")}
          >
            <PackageCheck className="mr-2 h-4 w-4" /> Siap Diambil
          </Button>
        )}
        {status_proses === "Siap Diambil" && (
          <>
            {tipe_layanan === "antar" || tipe_layanan === "antar_jemput" ? (
              <Button
                size="sm"
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={() => onUpdateStatus(transaksi, "Proses Pengantaran")}
              >
                <Truck className="mr-2 h-4 w-4" /> Mulai Pengantaran
              </Button>
            ) : (
              <Button
                size="sm"
                variant="success"
                className="w-full"
                onClick={() => onSelesaikan(transaksi)}
              >
                <Check className="mr-2 h-4 w-4" /> Selesaikan (Diambil)
              </Button>
            )}
          </>
        )}
        {status_proses === "Proses Pengantaran" && (
          <Button
            size="sm"
            variant="success"
            className="w-full"
            onClick={() => onSelesaikan(transaksi)}
          >
            <Check className="mr-2 h-4 w-4" /> Selesai Diantar
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
}) => {
  // [UPDATE] Tampilkan pesan jika kolom kosong
  return (
    <div className="flex-1 min-w-[300px]">
      <div className="p-4 text-center sticky top-16 bg-background/80 backdrop-blur-sm z-10">
        <h2 className="font-bold text-lg">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {transactions.length} order
        </p>
        <Separator className="mt-2" />
      </div>
      <div className="h-[calc(100vh-12rem)] overflow-y-auto px-2 pt-2">
        {transactions.length > 0 ? (
          transactions.map((tx) => (
            <TransaksiCard
              key={tx.id}
              transaksi={tx}
              onUpdateStatus={onUpdateStatus}
              onSelesaikan={onSelesaikan}
            />
          ))
        ) : (
          <p className="text-center text-sm text-muted-foreground p-4">
            Kosong
          </p>
        )}
      </div>
    </div>
  );
};

function ProsesPage() {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentTx, setCurrentTx] = useState(null);
  const [metodePembayaran, setMetodePembayaran] = useState("Cash");
  const [mobileView, setMobileView] = useState("jemput");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // [UPDATE] Kirim search term ke API
      const response = await api.get("/transaksi/aktif", {
        params: { search: searchTerm },
      });
      setTransaksi(response.data);
    } catch (err) {
      setError("Gagal mengambil data transaksi.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500); // Debounce
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleUpdateStatus = async (tx, newStatus) => {
    try {
      const { data } = await api.put(`/transaksi/${tx.id}/status`, {
        status: newStatus,
      });
      setTransaksi((prev) =>
        prev.map((t) => (t.id === tx.id ? { ...t, ...data.data } : t))
      );

      // Kirim notif WA jika status berubah menjadi 'Siap Diambil'
      if (newStatus === "Siap Diambil") {
        toast.info("Mempersiapkan notifikasi WhatsApp...");
        try {
          const response = await api.post("/transaksi/generate-wa-message", {
            kode_invoice: tx.kode_invoice,
            tipe_pesan: "siap_diambil",
          });
          const { pesan, nomor_hp } = response.data;
          const nomorHPFormatted = nomor_hp.startsWith("0")
            ? "62" + nomor_hp.substring(1)
            : nomor_hp;
          window.open(
            `https://wa.me/${nomorHPFormatted}?text=${encodeURIComponent(
              pesan
            )}`,
            "_blank"
          );
        } catch (waError) {
          toast.error(
            waError.response?.data?.message || "Gagal membuat pesan WA."
          );
        }
      }
    } catch (error) {
      toast.error("Gagal mengupdate status.");
    }
  };

  const handleSelesaikan = (tx) => {
    if (tx.status_pembayaran === "Belum Lunas") {
      setCurrentTx(tx);
      setMetodePembayaran("Cash");
      setIsPaymentModalOpen(true);
    } else {
      // Langsung selesaikan jika sudah lunas
      finalizeOrder(tx.id);
    }
  };

  const finalizeOrder = async (txId, paymentData = {}) => {
    try {
      await api.put(`/transaksi/${txId}/status`, {
        status: "Selesai",
        ...paymentData,
      });
      toast.success("Order berhasil diselesaikan!");
      // Hapus dari list setelah 500ms agar ada efek visual
      setTimeout(
        () => setTransaksi((prev) => prev.filter((t) => t.id !== txId)),
        500
      );
    } catch (error) {
      toast.error("Gagal menyelesaikan order.");
    }
  };

  const handleFinalizePayment = async () => {
    if (!currentTx || !metodePembayaran) return;
    await finalizeOrder(currentTx.id, { metode_pembayaran: metodePembayaran });
    setIsPaymentModalOpen(false);
    setCurrentTx(null);
  };

  const menungguPenjemputan = transaksi.filter(
    (tx) => tx.status_proses === "Menunggu Penjemputan"
  );
  const diterima = transaksi.filter((tx) => tx.status_proses === "Diterima");
  const prosesCuci = transaksi.filter(
    (tx) => tx.status_proses === "Proses Cuci"
  );
  const siapDiambil = transaksi.filter(
    (tx) => tx.status_proses === "Siap Diambil"
  );
  const prosesPengantaran = transaksi.filter(
    (tx) => tx.status_proses === "Proses Pengantaran"
  );

  const statusList = [
    {
      title: "Menunggu Penjemputan",
      data: menungguPenjemputan,
      value: "jemput",
    },
    { title: "Diterima", data: diterima, value: "terima" },
    { title: "Proses Cuci", data: prosesCuci, value: "cuci" },
    { title: "Siap Diambil", data: siapDiambil, value: "siap" },
    { title: "Proses Pengantaran", data: prosesPengantaran, value: "antar" },
  ];

  const activeMobileData =
    statusList.find((status) => status.value === mobileView)?.data || [];

  if (loading) return <p className="text-center">Memuat data order aktif...</p>;
  if (error) return <p className="text-center text-destructive">{error}</p>;

  if (transaksi.length === 0) {
    return (
      <div className="px-4">
        <h1 className="text-3xl font-bold mb-4">Proses Cucian</h1>
        <Input
          placeholder="Cari invoice, nama, atau nomor HP pelanggan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        <EmptyState
          icon={<ClipboardList className="h-16 w-16" />}
          title="Tidak Ada Order Aktif"
          description="Semua cucian sudah selesai atau belum ada transaksi baru yang masuk."
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 shrink-0">
        <h1 className="text-3xl font-bold mb-4">Proses Cucian</h1>
        <Input
          placeholder="Cari invoice, nama, atau nomor HP pelanggan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
      </div>

      <div className="md:hidden px-4">
        <Select value={mobileView} onValueChange={setMobileView}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih Status..." />
          </SelectTrigger>
          <SelectContent>
            {statusList.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.title} ({status.data.length})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-4 space-y-4">
          {activeMobileData.length > 0 ? (
            activeMobileData.map((tx) => (
              <TransaksiCard
                key={tx.id}
                transaksi={tx}
                onUpdateStatus={handleUpdateStatus}
                onSelesaikan={handleSelesaikan}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Tidak ada order di status ini.
            </p>
          )}
        </div>
      </div>

      {/* Tampilan untuk Desktop (Kanban View) - tidak berubah */}
      <div className="hidden md:flex flex-row -mx-4 flex-grow">
        {statusList.map((status) => (
          <React.Fragment key={status.value}>
            <KanbanColumn
              title={status.title}
              transactions={status.data}
              onUpdateStatus={handleUpdateStatus}
              onSelesaikan={handleSelesaikan}
            />
            {/* [FIX] Jangan tampilkan separator di kolom terakhir */}
            {status.value !== "antar" && (
              <Separator orientation="vertical" className="h-auto" />
            )}
          </React.Fragment>
        ))}
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
