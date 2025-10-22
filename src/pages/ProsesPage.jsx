// src/pages/ProsesPage.jsx (VERSI FINAL & ANTI-BOCOR)

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabaseClient"; // <-- Pake Supabase
import { useAuth } from "@/context/AuthContext"; // <-- Pake Auth
import { toast } from "sonner";
import { usePageVisibility } from "@/lib/usePageVisibility.js"; // <-- Pake Sensor

// Impor komponen
import { Button } from "@/components/ui/Button.jsx";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog.jsx";
import { Badge } from "@/components/ui/Badge.jsx";
import { Separator } from "@/components/ui/Separator.jsx";
import { Input } from "@/components/ui/Input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select.jsx";
import {
  WashingMachine,
  Check,
  PackageCheck,
  Truck,
  ArrowRight,
  ClipboardList,
  Loader2,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState.jsx";

// ==========================================================
// "RESEP" TransaksiCard DIBENERIN DI SINI
// ==========================================================
const TransaksiCard = ({
  transaksi,
  onUpdateStatus,
  onSelesaikan,
  isUpdating,
}) => {
  // BENERIN: Gunakan nama kolom asli
  const { process_status, payment_status, service_type } = transaksi;

  const getStatusVariant = () => {
    if (payment_status === "Lunas") return "success";
    if (payment_status === "Belum Lunas") return "warning";
    return "secondary";
  };

  return (
    <Card className="mb-4 shadow-md">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">
              {/* BENERIN: transaksi.customers.name */}
              {transaksi.customers?.name || "N/A"}
            </CardTitle>
            <CardDescription className="text-xs">
              {/* BENERIN: transaksi.invoice_code */}
              {transaksi.invoice_code}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant()}>{payment_status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
        {/* BENERIN: Loop lewat 'order_items' */}
        {transaksi.order_items?.map((item) => (
          <p key={item.id} className="truncate">
            • {item.packages?.name || "Nama Paket Error"}
          </p>
        ))}
      </CardContent>
      <CardFooter className="p-4">
        {/* Tambahkan 'disabled={isUpdating}' untuk mencegah klik ganda */}
        {process_status === "Diterima" && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onUpdateStatus(transaksi, "Proses Cuci")}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <WashingMachine className="mr-2 h-4 w-4" />
            )}{" "}
            Mulai Cuci
          </Button>
        )}
        {process_status === "Proses Cuci" && (
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            onClick={() => onUpdateStatus(transaksi, "Siap Diambil")}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PackageCheck className="mr-2 h-4 w-4" />
            )}{" "}
            Siap Diambil
          </Button>
        )}
        {process_status === "Siap Diambil" && (
          <>
            {service_type === "antar" || service_type === "antar_jemput" ? (
              <Button
                size="sm"
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={() => onUpdateStatus(transaksi, "Proses Pengantaran")}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="mr-2 h-4 w-4" />
                )}{" "}
                Mulai Pengantaran
              </Button>
            ) : (
              <Button
                size="sm"
                variant="default" // Ganti ke default biar warnanya gak bentrok
                className="w-full bg-green-500 text-white hover:bg-green-600"
                onClick={() => onSelesaikan(transaksi)}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}{" "}
                Selesaikan (Diambil)
              </Button>
            )}
          </>
        )}
        {process_status === "Proses Pengantaran" && (
          <Button
            size="sm"
            variant="default" // Ganti ke default biar warnanya gak bentrok
            className="w-full bg-green-500 text-white hover:bg-green-600"
            onClick={() => onSelesaikan(transaksi)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}{" "}
            Selesai Diantar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Komponen KanbanColumn
const KanbanColumn = ({
  title,
  transactions,
  onUpdateStatus,
  onSelesaikan,
  isUpdating, // <-- Kirim status loading
}) => {
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
              isUpdating={isUpdating === tx.id} // <-- Kirim status loading per kartu
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
  const { authState } = useAuth();
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(null); // State untuk loading per kartu
  const [searchTerm, setSearchTerm] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentTx, setCurrentTx] = useState(null);
  const [metodePembayaran, setMetodePembayaran] = useState("Cash");
  const [mobileView, setMobileView] = useState("terima");

  // ==========================================================
  // "MESIN" fetchData DI-UPGRADE TOTAL
  // ==========================================================
  const fetchData = useCallback(async () => {
    // Jangan fetch jika data auth belum siap
    if (!authState.business_id) return;

    try {
      setLoading(true);

      // VVV INI DIA PERUBAHANNYA VVV
      // Kita gak pake .from('orders') lagi, kita panggil "Koki" kita
      const { data, error } = await supabase.rpc("get_active_orders", {
        p_business_id: authState.business_id,
        p_role: authState.role,
        p_branch_id: authState.branch_id,
        p_search_term: searchTerm, // Kirim kata kuncinya ke "Koki"
      });
      // ^^^ AKHIR PERUBAHAN ^^^

      if (error) throw error;

      // Data yang balik udah 100% jadi dan siap pake
      setTransaksi(data || []);
    } catch (err) {
      toast.error("Gagal mengambil data transaksi: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, authState.business_id, authState.role, authState.branch_id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchData]);

  usePageVisibility(fetchData);

  // ==========================================================
  // "MESIN" handleUpdateStatus DI-UPGRADE TOTAL
  // ==========================================================
  const handleUpdateStatus = async (tx, newStatus) => {
    setIsUpdating(tx.id);
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({ process_status: newStatus })
        .eq("id", tx.id)
        .eq("business_id", authState.business_id)
        .select("*, customers(name), order_items(*, packages(name, unit))") // Ambil data baru
        .single();

      if (error) throw error;

      setTransaksi((prev) => prev.map((t) => (t.id === tx.id ? data : t)));

      if (newStatus === "Siap Diambil") {
        toast.info("Mempersiapkan notifikasi WhatsApp...");
        try {
          const { data: waData, error: waError } =
            await supabase.functions.invoke("generate-wa-message", {
              body: {
                invoice_code: tx.invoice_code,
                tipe_pesan: "siap_diambil",
              },
            });
          if (waError) throw waError;
          if (waData.message) throw new Error(waData.message);

          const { pesan, nomor_hp } = waData;
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
          toast.error(waError.message || "Gagal membuat pesan WA.");
        }
      }
    } catch (error) {
      toast.error("Gagal mengupdate status: " + error.message);
    } finally {
      setIsUpdating(null);
    }
  };

  // ==========================================================
  // "MESIN" finalizeOrder DI-UPGRADE TOTAL
  // ==========================================================
  const finalizeOrder = async (txId, paymentData = {}) => {
    setIsUpdating(txId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          process_status: "Selesai",
          payment_status: "Lunas",
          ...paymentData,
        })
        .eq("id", txId)
        .eq("business_id", authState.business_id);

      if (error) throw error;

      toast.success("Order berhasil diselesaikan!");
      setTimeout(
        () => setTransaksi((prev) => prev.filter((t) => t.id !== txId)),
        500
      );
    } catch (error) {
      toast.error("Gagal menyelesaikan order: " + error.message);
    } finally {
      setIsUpdating(null);
      setIsPaymentModalOpen(false);
      setCurrentTx(null);
    }
  };

  const handleSelesaikan = (tx) => {
    if (tx.payment_status === "Belum Lunas") {
      setCurrentTx(tx);
      setMetodePembayaran("Cash");
      setIsPaymentModalOpen(true);
    } else {
      finalizeOrder(tx.id);
    }
  };

  const handleFinalizePayment = async () => {
    if (!currentTx || !metodePembayaran) return;
    // VVV INI YANG BENER VVV
    await finalizeOrder(currentTx.id, { payment_method: metodePembayaran });
  };
  // Filter data (BENERIN: pake nama kolom asli)
  const diterima = transaksi.filter((tx) => tx.process_status === "Diterima");
  const prosesCuci = transaksi.filter(
    (tx) => tx.process_status === "Proses Cuci"
  );
  const siapDiambil = transaksi.filter(
    (tx) => tx.process_status === "Siap Diambil"
  );
  const prosesPengantaran = transaksi.filter(
    (tx) => tx.process_status === "Proses Pengantaran"
  );

  const statusList = [
    { title: "Diterima", data: diterima, value: "terima" },
    { title: "Proses Cuci", data: prosesCuci, value: "cuci" },
    { title: "Siap Diambil", data: siapDiambil, value: "siap" },
    { title: "Proses Pengantaran", data: prosesPengantaran, value: "antar" },
  ];

  const activeMobileData =
    statusList.find((status) => status.value === mobileView)?.data || [];

  if (loading) return <p className="text-center">Memuat data order aktif...</p>;

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

      {/* Tampilan Mobile */}
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
                isUpdating={isUpdating === tx.id}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Tidak ada order di status ini.
            </p>
          )}
        </div>
      </div>

      {/* Tampilan Desktop (Kanban) */}
      <div className="hidden md:flex flex-row -mx-4 flex-grow">
        {statusList.map((status) => (
          <React.Fragment key={status.value}>
            <KanbanColumn
              title={status.title}
              transactions={status.data}
              onUpdateStatus={handleUpdateStatus}
              onSelesaikan={handleSelesaikan}
              isUpdating={isUpdating}
            />
            {status.value !== "antar" && (
              <Separator orientation="vertical" className="h-auto" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Modal Pelunasan */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pelunasan Order</DialogTitle>
            <DialogDescription>
              Order ini belum lunas. Pilih metode pembayaran.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="text-sm">
              <p>
                Invoice:{" "}
                <span className="font-mono">{currentTx?.invoice_code}</span>
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
            <Button
              variant="default" // Ganti ke default
              className="bg-green-500 text-white hover:bg-green-600" // <-- CAT HIJAU DI SINI
              onClick={handleFinalizePayment}
            >
              Konfirmasi & Selesaikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProsesPage;
