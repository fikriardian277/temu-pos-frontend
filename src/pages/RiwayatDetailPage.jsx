// src/pages/RiwayatDetailPage.jsx

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import { useReactToPrint } from "react-to-print";
import Struk from "../components/struk/Struk";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const formatRupiah = (value) => {
  if (value == null) return "0";
  return Number(value).toLocaleString("id-ID");
};

export default function RiwayatDetailPage() {
  const { kode_invoice } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();

  const [transaksi, setTransaksi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ref untuk react-to-print v3 (contentRef)
  const strukRef = useRef(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/transaksi/${kode_invoice}`);
        setTransaksi(res.data);
      } catch (err) {
        console.error("Gagal ambil detail:", err);
        setError("Gagal memuat detail transaksi.");
      } finally {
        setLoading(false);
      }
    };

    if (kode_invoice) fetchDetail();
  }, [kode_invoice]);

  // Print handler (react-to-print v3)
  const handlePrint = useReactToPrint({
    contentRef: strukRef,
    documentTitle: transaksi?.kode_invoice
      ? `struk-${transaksi.kode_invoice}`
      : "struk",
    removeAfterPrint: true,
  });

  const handleKirimWA = () => {
    if (!transaksi) return;
    const {
      kode_invoice: kode,
      createdAt,
      Pelanggan,
      Pakets,
      grand_total,
      poin_digunakan,
      poin_didapat,
      status_pembayaran,
      catatan,
      metode_pembayaran,
    } = transaksi;

    const subtotal = Array.isArray(Pakets)
      ? Pakets.reduce(
          (total, item) => total + (item.DetailTransaksi?.subtotal || 0),
          0
        )
      : 0;

    let pesan = `*Struk Digital Laundry*\n\n`;
    pesan += `Invoice: *${kode}*\n`;
    pesan += `Pelanggan: ${Pelanggan?.nama || "-"}\n`;
    pesan += `Tanggal: ${new Date(createdAt).toLocaleString("id-ID")}\n`;
    pesan += `-----------------------\n`;

    if (Array.isArray(Pakets)) {
      Pakets.forEach((p) => {
        const jumlah = p.DetailTransaksi?.jumlah || 0;
        const subtotalItem = p.DetailTransaksi?.subtotal || 0;
        pesan += `${
          p.Layanan?.nama_layanan ? p.Layanan.nama_layanan + " - " : ""
        }${p.nama_paket}\n`;
        pesan += `${jumlah} ${p.satuan || ""} x Rp ${formatRupiah(
          p.harga || 0
        )} = *Rp ${formatRupiah(subtotalItem)}*\n\n`;
      });
    }

    pesan += `-----------------------\n`;
    pesan += `Subtotal: Rp ${formatRupiah(subtotal)}\n`;
    if (poin_digunakan > 0) {
      const diskon =
        poin_digunakan * (authState.pengaturan?.rupiah_per_poin_redeem || 0);
      pesan += `Diskon Poin: - Rp ${formatRupiah(diskon)}\n`;
    }
    pesan += `*GRAND TOTAL: Rp ${formatRupiah(grand_total)}*\n`;
    pesan += `Status: *${status_pembayaran}* ${
      status_pembayaran === "Lunas" && metode_pembayaran
        ? `(${metode_pembayaran})`
        : ""
    }\n\n`;

    if (Pelanggan?.status_member === "Aktif") {
      pesan += `--- Info Poin ---\n`;
      pesan += `Poin Ditukar: -${poin_digunakan}\n`;
      pesan += `Poin Didapat: +${poin_didapat}\n`;
      pesan += `Poin Sekarang: *${Pelanggan?.poin || 0}*\n\n`;
    }

    if (catatan) {
      pesan += `--- Catatan ---\n${catatan}\n\n`;
    }
    pesan += `Terima kasih!`;

    const nomorHPRaw = Pelanggan?.nomor_hp || "";
    const nomorHP = nomorHPRaw.startsWith("0")
      ? "62" + nomorHPRaw.slice(1)
      : nomorHPRaw;
    if (!nomorHP) {
      return alert("Nomor HP pelanggan tidak tersedia.");
    }
    const url = `https://wa.me/${nomorHP}?text=${encodeURIComponent(pesan)}`;
    window.open(url, "_blank");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="p-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Kembali
        </Button>
      </div>
    );

  if (!transaksi)
    return (
      <div className="p-4">
        <p>Tidak ada data transaksi.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Kembali
        </Button>
      </div>
    );

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Detail Transaksi</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Kembali
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Cetak Struk
          </Button>
          <Button variant="default" onClick={handleKirimWA}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Kirim WA
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Preview Struk (pakai ref langsung agar bisa di-print) */}
        <div className="lg:col-span-1 flex justify-center">
          <div className="w-[220px]">
            {/* Struk menerima ref (forwardRef) sehingga bisa diprint */}
            <Struk ref={strukRef} transaksi={transaksi} />
          </div>
        </div>

        {/* RIGHT: Metadata & ringkasan */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
              <CardDescription>Informasi singkat transaksi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Invoice</div>
                  <div className="font-mono font-semibold">
                    {transaksi.kode_invoice}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Tanggal</div>
                  <div>
                    {new Date(transaksi.createdAt).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground">Pelanggan</div>
                  <div>{transaksi.Pelanggan?.nama || "-"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Nomor HP</div>
                  <div>{transaksi.Pelanggan?.nomor_hp || "-"}</div>
                </div>

                <div>
                  <div className="text-muted-foreground">Status Pembayaran</div>
                  <div className="mt-1">
                    <Badge
                      variant={
                        transaksi.status_pembayaran === "Lunas"
                          ? "success"
                          : "destructive"
                      }
                    >
                      {transaksi.status_pembayaran}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground">Status Proses</div>
                  <div className="mt-1">
                    <Badge variant="secondary">{transaksi.status_proses}</Badge>
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground">Metode Pembayaran</div>
                  <div>{transaksi.metode_pembayaran || "-"}</div>
                </div>

                <div>
                  <div className="text-muted-foreground">Cabang</div>
                  <div>{transaksi.Cabang?.nama_cabang || "-"}</div>
                </div>

                <div className="col-span-2">
                  <div className="text-muted-foreground">Subtotal</div>
                  <div className="font-semibold">
                    Rp{" "}
                    {formatRupiah(
                      Array.isArray(transaksi.Pakets)
                        ? transaksi.Pakets.reduce(
                            (t, p) => t + (p.DetailTransaksi?.subtotal || 0),
                            0
                          )
                        : 0
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground">Diskon Poin</div>
                  <div>
                    - Rp{" "}
                    {formatRupiah(
                      (transaksi.poin_digunakan || 0) *
                        (authState.pengaturan?.rupiah_per_poin_redeem || 0)
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Grand Total</div>
                  <div className="font-semibold">
                    Rp {formatRupiah(transaksi.grand_total)}
                  </div>
                </div>

                {transaksi.catatan && (
                  <div className="col-span-2">
                    <div className="text-muted-foreground">Catatan</div>
                    <div>{transaksi.catatan}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detail paket (table-like) */}
          <Card>
            <CardHeader>
              <CardTitle>Rincian Paket</CardTitle>
              <CardDescription>Daftar layanan dan harga</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="pb-2">Layanan</th>
                      <th className="pb-2">Jumlah</th>
                      <th className="pb-2 text-right">Harga</th>
                      <th className="pb-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(transaksi.Pakets) &&
                    transaksi.Pakets.length > 0 ? (
                      transaksi.Pakets.map((p) => (
                        <tr
                          key={p.id || `${p.nama_paket}-${Math.random()}`}
                          className="border-t"
                        >
                          <td className="py-2">
                            {p.Layanan?.nama_layanan
                              ? `${p.Layanan.nama_layanan} — ${p.nama_paket}`
                              : p.nama_paket}
                          </td>
                          <td className="py-2">
                            {p.DetailTransaksi?.jumlah || 0} {p.satuan || ""}
                          </td>
                          <td className="py-2 text-right">
                            Rp {formatRupiah(p.harga)}
                          </td>
                          <td className="py-2 text-right">
                            Rp {formatRupiah(p.DetailTransaksi?.subtotal || 0)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-6 text-center text-muted-foreground"
                        >
                          Tidak ada paket.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
