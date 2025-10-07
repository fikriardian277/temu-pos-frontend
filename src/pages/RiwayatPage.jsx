import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../api/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import { useReactToPrint } from "react-to-print";
import Struk from "../components/struk/Struk";
import { toast } from "sonner";

// shadcn/ui
import { Button } from "@/components/ui/Button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.jsx";
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

  const { authState } = useAuth();

  // ✅ contentRef untuk react-to-print v3
  const strukRef = useRef(null);

  const fetchRiwayat = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/transaksi?search=${searchTerm}`);
      setTransaksis(response.data);
    } catch (err) {
      setError("Gagal mengambil riwayat transaksi.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => fetchRiwayat(), 500);
    return () => clearTimeout(timer);
  }, [fetchRiwayat]);

  // ✅ API baru pakai contentRef, bukan content: () => ref.current
  const handlePrint = useReactToPrint({
    contentRef: strukRef,
    documentTitle: detailTransaksi?.kode_invoice || "Struk",
    removeAfterPrint: true,
  });

  const handleViewDetail = async (tx) => {
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    setDetailTransaksi(null);
    try {
      const response = await api.get(`/transaksi/${tx.kode_invoice}`);
      setDetailTransaksi(response.data);
    } catch (err) {
      console.error("Gagal fetch detail:", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleKirimWA = async (tx) => {
    // [FIX] Gunakan 'detailTransaksi' yang datanya lengkap, bukan 'tx'
    if (!detailTransaksi)
      return toast.error("Detail transaksi belum termuat, coba sesaat lagi.");
    try {
      const response = await api.post("/transaksi/generate-wa-message", {
        kode_invoice: detailTransaksi.kode_invoice,
        tipe_pesan: "struk",
      });

      const { pesan, nomor_hp } = response.data;

      const nomorHPFormatted = nomor_hp.startsWith("0")
        ? "62" + nomor_hp.substring(1)
        : nomor_hp;
      const url = `https://wa.me/${nomorHPFormatted}?text=${encodeURIComponent(
        pesan
      )}`;
      window.open(url, "_blank");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal membuat pesan WA.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Riwayat Transaksi</h1>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Semua Transaksi</CardTitle>
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
          {/* [DIROMBAK] Logika Tampilan di sini */}
          {loading ? (
            <p className="text-center py-10">Memuat riwayat...</p>
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
                        {tx.kode_invoice}
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {tx.Pelanggan?.nama || "N/A"}
                      </TableCell>
                      <TableCell>
                        {new Date(tx.createdAt).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {tx.grand_total.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.status_pembayaran === "Lunas"
                              ? "success"
                              : "warning"
                          }
                        >
                          {tx.status_pembayaran}
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
            // [BARU] Tampilkan EmptyState jika tidak ada data
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
              Detail Invoice: {detailTransaksi?.kode_invoice || "Memuat..."}
            </DialogTitle>
            <DialogDescription>
              Detail struk transaksi. Anda dapat mencetak ulang atau mengirimnya
              via WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {isDetailLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : detailTransaksi ? (
              <>
                {/* Preview Struk di modal */}
                <div className="border rounded-lg bg-muted/30 p-2">
                  <div className="max-h-64 overflow-y-auto">
                    <div className="w-[220px] mx-auto">
                      <Struk transaksi={detailTransaksi} />
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Cetak Ulang
                  </Button>
                  <Button variant="success" onClick={handleKirimWA}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Kirim WA
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
          <Struk transaksi={detailTransaksi} />
        </div>
      </div>
    </div>
  );
}

export default RiwayatPage;
