// src/pages/RiwayatDetailPage.jsx (VERSI FINAL & ANTI-BOCOR)

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient"; // <-- BENERIN
import { useAuth } from "@/context/AuthContext"; // <-- BENERIN
import Struk from "../components/struk/Struk"; // <-- Komponen Struk
import PrintStrukButton from "../components/struk/PrintStrukButton"; // <-- Tombol Print KITA
import { toast } from "sonner";
import { usePageVisibility } from "@/lib/usePageVisibility.js"; // <-- Sensor anti-macet

// ... (semua import komponen UI & ikon tidak berubah)
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/Card.jsx";
import { Button } from "@/components/ui/Button.jsx";
import { Loader2, Printer, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/Badge.jsx";

const formatRupiah = (value) => {
  /* ... (fungsi formatRupiah tidak berubah) ... */
};

export default function RiwayatDetailPage() {
  const { kode_invoice } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();

  const [transaksi, setTransaksi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // LOGIKA "SENSOR KESIAPAN STRUK" (KITA CURI DARI KASIRPAGE)
  // ==========================================================
  const strukRef = useRef(null);
  const [isStrukReady, setIsStrukReady] = useState(false);

  // "Mesin" Fetch Data (sudah di-upgrade)
  const fetchDetail = useCallback(async () => {
    if (!kode_invoice || !authState.business_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      let query = supabase
        .from("orders")
        .select(
          `
          *, 
          tipe_order, 
          pickup_date, 
          customers!inner(id, name, tipe_pelanggan, id_identitas_bisnis), 
          branches(id, name, address, phone_number), 
          order_items(*, packages(*, services(name)))
        `
        )
        .eq("invoice_code", kode_invoice)
        .eq("business_id", authState.business_id);

      if (authState.role !== "owner") {
        query = query.eq("branch_id", authState.branch_id);
      }
      const { data, error } = await query.single();
      if (error) throw error;
      setTransaksi(data);
    } catch (err) {
      console.error("Gagal ambil detail:", err);
      setError("Gagal memuat detail transaksi atau transaksi tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  }, [
    kode_invoice,
    authState.business_id,
    authState.role,
    authState.branch_id,
  ]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // usePageVisibility(fetchDetail);

  // "Sensor" Kesiapan Struk (sama persis kayak di KasirPage)
  useEffect(() => {
    setIsStrukReady(false);
    if (transaksi) {
      // <-- Cek 'transaksi', bukan 'detailTransaksiSukses'
      const timer = setTimeout(() => {
        if (strukRef.current) {
          setIsStrukReady(true);
        } else {
          console.error("ERROR: Ref struk masih kosong setelah jeda render.");
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [transaksi]);
  // ==========================================================
  // "MESIN" KIRIM WA DI-UPGRADE TOTAL
  // ==========================================================
  const [loadingWA, setLoadingWA] = useState(false);

  const handleKirimWA = async () => {
    // Pake 'transaksi', variabel yang ada di RiwayatDetailPage
    if (!transaksi || loadingWA) return;
    setLoadingWA(true);

    try {
      // VVV INI DIA KODENYA DISAMAIN VVV
      // Pake 'rpc' (Database Function) persis kayak di KasirPage
      const { data, error } = await supabase.rpc("generate_wa_message", {
        payload: {
          invoice_code: transaksi.invoice_code, // Pake 'transaksi'
          tipe_pesan: "struk",
        },
      });
      // ^^^ SELESAI DISAMAIN ^^^

      if (error) throw error;
      if (data.message) throw new Error(data.message);

      const { pesan, nomor_hp } = data;

      // "Penjaga" anti-crash (ini udah bener)
      const nomorHPNormalized = (nomor_hp || "").trim();
      if (!nomorHPNormalized) {
        toast.error("Nomor HP pelanggan tidak ditemukan atau tidak valid.");
        setLoadingWA(false);
        return;
      }

      const nomorHPFormatted = nomorHPNormalized.startsWith("0")
        ? "62" + nomorHPNormalized.substring(1)
        : nomorHPNormalized;

      // URL pake 'api.whatsapp.com' (ini udah bener)
      const url = `https://api.whatsapp.com/send?phone=${nomorHPFormatted}&text=${encodeURIComponent(
        pesan
      )}`;

      console.log("MENCOBA MEMBUKA (API):", url);
      console.log("PANJANG URL:", url.length);

      window.open(url, "_blank");
    } catch (error) {
      console.error("DEBUG kirimWA:", error);
      toast.error(error.message || "Gagal membuat pesan WA.");
    } finally {
      setLoadingWA(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Kembali
        </Button>
      </div>
    );

  if (!transaksi)
    return (
      <div className="p-4 text-center">
        <p>Tidak ada data transaksi ditemukan.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Kembali
        </Button>
      </div>
    );

  // ==========================================================
  // JSX (TAMPILAN) DIBENERIN BIAR COCOK "KAMUS FINAL"
  // ==========================================================
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Detail Transaksi</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Kembali
          </Button>
          {/* BENERIN: Panggil komponen <PrintStrukButton> */}
          <PrintStrukButton
            componentRef={strukRef}
            disabled={!isStrukReady} // <-- Pake gembok sensor
          />
          <Button
            variant="default"
            onClick={handleKirimWA}
            disabled={loadingWA}
          >
            {loadingWA ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Kirim WA
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Preview Struk (tampil di UI) */}
        <div className="lg:col-span-1 flex justify-center">
          <div className="w-[220px]">
            {/* BENERIN: Kasih 'pengaturan' ke Struk */}
            <Struk transaksi={transaksi} pengaturan={authState.pengaturan} />
          </div>
        </div>

        {/* RIGHT: Metadata & ringkasan */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Invoice</div>
                  <div className="font-mono font-semibold">
                    {transaksi.invoice_code}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Tanggal Diterima</div>
                  <div>
                    {new Date(transaksi.created_at).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Estimasi Selesai</div>
                  <div>
                    {new Date(
                      transaksi.estimated_completion_date
                    ).toLocaleString("id-ID", {
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
                  <div>{transaksi.customers?.name || "-"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Nomor HP</div>
                  <div>{transaksi.customers?.phone_number || "-"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status Pembayaran</div>
                  <div className="mt-1">
                    <Badge
                      variant={
                        transaksi.payment_status === "Lunas"
                          ? "success"
                          : "warning"
                      }
                    >
                      {transaksi.payment_status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status Proses</div>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {transaksi.process_status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Metode Pembayaran</div>
                  <div>{transaksi.payment_method || "-"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Cabang</div>
                  <div>{transaksi.branches?.name || "-"}</div>
                </div>

                {/* --- BAGIAN KALKULASI TOTAL (PAKE DATA DARI DB) --- */}
                <div className="col-span-2 pt-2 border-t">
                  <div className="text-muted-foreground">Subtotal</div>
                  <div className="font-semibold">
                    Rp{" "}
                    {formatRupiah(
                      transaksi.subtotal + transaksi.membership_fee_paid
                    )}
                  </div>
                </div>
                {transaksi.service_fee > 0 && (
                  <div>
                    <div className="text-muted-foreground">Biaya Layanan</div>
                    <div>Rp {formatRupiah(transaksi.service_fee)}</div>
                  </div>
                )}
                {transaksi.discount_amount > 0 && (
                  <div>
                    <div className="text-muted-foreground">Diskon Poin</div>
                    <div>- Rp {formatRupiah(transaksi.discount_amount)}</div>
                  </div>
                )}
                <div className="col-span-2">
                  <div className="text-muted-foreground">Grand Total</div>
                  <div className="font-semibold text-lg">
                    Rp {formatRupiah(transaksi.grand_total)}
                  </div>
                </div>
                {transaksi.notes && (
                  <div className="col-span-2">
                    <div className="text-muted-foreground">Catatan</div>
                    <div>{transaksi.notes}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detail paket */}
          <Card>
            <CardHeader>
              <CardTitle>Rincian Paket</CardTitle>
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
                    {transaksi.order_items?.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="py-2">{item.packages?.name || "N/A"}</td>
                        <td className="py-2">
                          {item.quantity} {item.packages?.unit || ""}
                        </td>
                        <td className="py-2 text-right">
                          Rp {formatRupiah(item.packages?.price)}
                        </td>
                        <td className="py-2 text-right">
                          Rp {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* OFF-SCREEN struk khusus untuk print */}
      <div
        ref={strukRef} // <-- 'ref' nempel di sini
        className="absolute -left-[9999px] top-0 print:static print:block"
        aria-hidden="true"
      >
        {/* BENERIN: Kasih 'pengaturan' ke Struk ini juga */}
        <Struk transaksi={transaksi} pengaturan={authState.pengaturan} />
      </div>
    </div>
  );
}
