// src/pages/RiwayatPage.jsx (VERSI ANTI-BOCOR & LENGKAP)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/supabaseClient"; // <-- BENERIN
import { useAuth } from "@/context/AuthContext"; // <-- BENERIN
import { useReactToPrint } from "react-to-print";
import Struk from "../components/struk/Struk";
import { toast } from "sonner";
import { usePageVisibility } from "@/lib/usePageVisibility.js"; // <-- Tambah sensor

// ... (semua import komponen UI & ikon tidak berubah)
import { Button } from "@/components/ui/Button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card.jsx";
import { Input } from "@/components/ui/Input.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table.jsx";
import { Badge } from "@/components/ui/Badge.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog.jsx";
import { Printer, MessageSquare, Loader2, History } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState.jsx";

function RiwayatPage() {
  const [transaksis, setTransaksis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [detailTransaksi, setDetailTransaksi] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loadingWA, setLoadingWA] = useState(false);
  const { authState } = useAuth();
  const strukRef = useRef(null);

  // ==========================================================
  // "MESIN" FETCH DATA DI-UPGRADE TOTAL
  // ==========================================================
  const fetchRiwayat = useCallback(async () => {
    // Jangan fetch jika data auth belum siap
    if (!authState.business_id || !authState.branch_id) {
      setLoading(false); // Matikan loading jika data belum siap
      return;
    }

    try {
      setLoading(true);
      setError("");

      let data, error;

      if (searchTerm) {
        // VVV KALO LAGI NYARI: PAKE RPC VVV
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "search_riwayat_transaksi",
          {
            search_term: searchTerm,
            p_business_id: authState.business_id,
            p_branch_id: authState.branch_id,
          }
        );
        data = rpcData;
        error = rpcError;
      } else {
        // VVV KALO GAK NYARI: PAKE CARA LAMA (AMBIL 50 TERAKHIR) VVV
        const { data: queryData, error: queryError } = await supabase
          .from("orders")
          .select("*, customers!inner(name, phone_number)") // inner join tetep aman di sini
          .eq("business_id", authState.business_id)
          .eq("branch_id", authState.branch_id)
          .order("created_at", { ascending: false })
          .limit(50);

        data = queryData;
        error = queryError;
      }

      if (error) throw error;

      // VVV SESUAIKAN DATA BIAR COCOK SAMA RPC VVV
      // RPC ngasih 'customer_name', query lama ngasih 'customers.name'
      // Kita samain formatnya di sini
      const formattedData = data.map((tx) => ({
        ...tx,
        // Ini bikin object 'customers' palsu biar TableRow-nya tetep jalan
        customers: {
          name: tx.customer_name || tx.customers?.name,
          phone_number: tx.customer_phone || tx.customers?.phone_number,
        },
      }));

      setTransaksis(formattedData || []);
    } catch (err) {
      setError("Gagal mengambil riwayat transaksi. " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, authState.business_id, authState.branch_id]);
  useEffect(() => {
    const timer = setTimeout(() => fetchRiwayat(), 500);
    return () => clearTimeout(timer);
  }, [fetchRiwayat]);

  usePageVisibility(fetchRiwayat); // Pasang sensor anti-macet

  // Print handler (sudah bener pake v3 contentRef)
  const handlePrint = useReactToPrint({
    contentRef: strukRef,
    documentTitle: detailTransaksi?.invoice_code || "Struk",
  });

  // ==========================================================
  // "MESIN" VIEW DETAIL & KIRIM WA DI-UPGRADE TOTAL
  // ==========================================================
  const handleViewDetail = async (tx) => {
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    setDetailTransaksi(null);
    try {
      // Ambil data LENGKAP untuk modal (sama kayak di RiwayatDetailPage)
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(*), branches(*), order_items(*, packages(*))")
        .eq("invoice_code", tx.invoice_code) // <-- Pake invoice_code
        .eq("business_id", authState.business_id) // <-- Keamanan
        .single();

      if (error) throw error;
      setDetailTransaksi(data);
    } catch (err) {
      console.error("Gagal fetch detail:", err);
      toast.error("Gagal memuat detail transaksi.");
      setIsDetailOpen(false); // Tutup modal jika error
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleKirimWA = async () => {
    // Pake 'detailTransaksi' (udah bener) dan tambah 'loadingWA'
    if (!detailTransaksi || loadingWA) return;
    setLoadingWA(true); // <-- Tambah ini

    try {
      // VVV GANTI PAKE RPC VVV
      const { data, error } = await supabase.rpc("generate_wa_message", {
        payload: {
          invoice_code: detailTransaksi.invoice_code,
          tipe_pesan: "struk",
        },
      });
      // ^^^ SELESAI GANTI RPC ^^^

      if (error) throw error;
      if (data.message) throw new Error(data.message);

      const { pesan, nomor_hp } = data;

      // VVV TAMBAH "PENJAGA" ANTI CRASH VVV
      const nomorHPNormalized = (nomor_hp || "").trim();
      if (!nomorHPNormalized) {
        toast.error("Nomor HP pelanggan tidak ditemukan atau tidak valid.");
        setLoadingWA(false); // <-- Jangan lupa
        return;
      }

      const nomorHPFormatted = nomorHPNormalized.startsWith("0")
        ? "62" + nomorHPNormalized.substring(1)
        : nomorHPNormalized;
      // ^^^ SELESAI PENJAGA ^^^

      // VVV GANTI KE API.WHATSAPP.COM VVV
      const url = `https://api.whatsapp.com/send?phone=${nomorHPFormatted}&text=${encodeURIComponent(
        pesan
      )}`;
      // ^^^ SELESAI GANTI URL ^^^

      console.log("MENCOBA MEMBUKA (API):", url);
      console.log("PANJANG URL:", url.length);

      window.open(url, "_blank");
    } catch (error) {
      console.error("DEBUG kirimWA:", error);
      toast.error(error.message || "Gagal membuat pesan WA.");
    } finally {
      setLoadingWA(false); // <-- Tambah finally
    }
  };

  // ==========================================================
  // JSX (TAMPILAN) KITA BENERIN BIAR COCOK "KAMUS FINAL"
  // ==========================================================
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Riwayat Transaksi</h1>
      <Card>
        <CardHeader>
          <CardTitle>Daftar 50 Transaksi Terakhir</CardTitle>
          <CardDescription>
            Cari transaksi berdasarkan invoice, nama, atau nomor HP pelanggan.
          </CardDescription>
          <Input
            type="text"
            placeholder="Cari transaksi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-center text-destructive py-10">{error}</p>
          ) : transaksis.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaksis.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono font-semibold">
                        {tx.invoice_code}
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {tx.customers?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {new Date(tx.created_at).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {tx.grand_total.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.payment_status === "Lunas"
                              ? "success"
                              : "warning"
                          }
                        >
                          {tx.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(tx)}
                        >
                          Lihat Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={<History className="h-16 w-16" />}
              title="Riwayat Transaksi Kosong"
              description="Tidak ada transaksi yang cocok dengan filter Anda, atau belum ada transaksi sama sekali."
            />
          )}
        </CardContent>
      </Card>

      {/* Modal Detail */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Detail Invoice: {detailTransaksi?.invoice_code || "Memuat..."}
            </DialogTitle>
            <DialogDescription>Detail struk transaksi.</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {isDetailLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : detailTransaksi ? (
              <>
                <div className="border rounded-lg bg-muted/30 p-2">
                  <div className="max-h-64 overflow-y-auto">
                    <div className="w-[220px] mx-auto">
                      {/* BENERIN: Kasih 'pengaturan' ke Struk */}
                      <Struk
                        transaksi={detailTransaksi}
                        pengaturan={authState.pengaturan}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Cetak Ulang
                  </Button>
                  <Button
                    variant="default"
                    className="bg-green-500 hover:bg-green-600"
                    onClick={handleKirimWA}
                    disabled={loadingWA || isDetailLoading} // <-- TAMBAH INI
                  >
                    {loadingWA ? ( // <-- TAMBAH INI
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Kirim WA
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-center text-destructive py-8">
                Gagal memuat detail transaksi.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Elemen tersembunyi untuk keperluan print */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div ref={strukRef}>
          {/* BENERIN: Kasih 'pengaturan' ke Struk */}
          <Struk
            transaksi={detailTransaksi}
            pengaturan={authState.pengaturan}
          />
        </div>
      </div>
    </div>
  );
}

export default RiwayatPage;
