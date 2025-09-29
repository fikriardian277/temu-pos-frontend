import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../api/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import { useReactToPrint } from "react-to-print";
import Struk from "../components/struk/Struk";

// shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Printer, MessageSquare, Loader2 } from "lucide-react";

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

  const handleKirimWA = () => {
    if (!detailTransaksi) return;

    const {
      kode_invoice,
      createdAt,
      Pelanggan,
      Pakets,
      grand_total,
      poin_digunakan,
      poin_didapat,
      status_pembayaran,
      catatan,
    } = detailTransaksi;

    const subtotal = Pakets.reduce(
      (total, item) => total + (item.DetailTransaksi?.subtotal || 0),
      0
    );
    let pesan = `*Struk Digital Laundry*\n\nInvoice: *${kode_invoice}*\nPelanggan: ${
      Pelanggan.nama
    }\nTanggal: ${new Date(createdAt).toLocaleString(
      "id-ID"
    )}\n-----------------------\n`;
    Pakets.forEach((p) => {
      pesan += `${p.Layanan?.nama_layanan || ""} - ${p.nama_paket}\n`;
      pesan += `${p.DetailTransaksi?.jumlah || 0} ${
        p.satuan
      } x Rp ${p.harga.toLocaleString("id-ID")} = *Rp ${(
        p.DetailTransaksi?.subtotal || 0
      ).toLocaleString("id-ID")}*\n\n`;
    });
    pesan += `-----------------------\nSubtotal: Rp ${subtotal.toLocaleString(
      "id-ID"
    )}\n`;
    if (poin_digunakan > 0) {
      const diskon =
        poin_digunakan * (authState.pengaturan?.rupiah_per_poin_redeem || 0);
      pesan += `Diskon Poin: - Rp ${diskon.toLocaleString("id-ID")}\n`;
    }
    pesan += `*GRAND TOTAL: Rp ${grand_total.toLocaleString(
      "id-ID"
    )}*\nStatus: *${status_pembayaran}*\n\n`;
    if (Pelanggan.status_member === "Aktif") {
      pesan += `--- Info Poin ---\nPoin Ditukar: -${poin_digunakan}\nPoin Didapat: +${poin_didapat}\nPoin Sekarang: *${Pelanggan.poin}*\n\n`;
    }
    if (catatan) {
      pesan += `--- Catatan ---\n${catatan}\n\n`;
    }
    pesan += `Terima kasih!`;
    const nomorHP = Pelanggan.nomor_hp.startsWith("0")
      ? "62" + Pelanggan.nomor_hp.substring(1)
      : Pelanggan.nomor_hp;
    window.open(
      `https://wa.me/${nomorHP}?text=${encodeURIComponent(pesan)}`,
      "_blank"
    );
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Memuat riwayat...
                    </TableCell>
                  </TableRow>
                ) : transaksis.length > 0 ? (
                  transaksis.map((tx) => (
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Tidak ada data transaksi.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
