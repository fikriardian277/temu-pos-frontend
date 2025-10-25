// src/pages/KasirPage.jsx (VERSI FINAL & ANTI-BOCOR)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { usePageVisibility } from "@/lib/usePageVisibility.js";

// Komponen & Ikon
import CustomerSection from "../components/kasir/CustomerSection";
import ServiceSelector from "../components/kasir/ServiceSelector.jsx";
import Cart from "../components/kasir/Cart";
import Struk from "../components/struk/Struk";
import PrintStrukButton from "../components/struk/PrintStrukButton";
import { CheckCircle, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/Textarea.jsx";
import { Button } from "@/components/ui/Button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog.jsx";
import { Input } from "@/components/ui/Input.jsx";
import { Label } from "@/components/ui/Label.jsx";

// NOTE: Pastikan semua komponen di atas (CustomerSection, Cart, dll) juga sudah di-update
// untuk menggunakan nama kolom yang benar (misal: props.pelanggan.name, bukan .nama)

function KasirPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authState } = useAuth();

  // ==========================================================
  // BAGIAN INI 100% DITERJEMAHKAN KE "KAMUS FINAL"
  // ==========================================================
  const isPoinSystemActive = authState.pengaturan?.points_scheme !== "nonaktif";
  const isPaidMembershipRequired =
    authState.pengaturan?.require_paid_membership;
  const isBonusMerchandiseActive = authState.pengaturan?.is_merch_bonus_active;
  const merchandiseName =
    authState.pengaturan?.merch_bonus_name || "Merchandise";
  const BIAYA_MEMBER = authState.pengaturan?.membership_fee || 0;
  // ==========================================================

  // State
  const [selectedPelanggan, setSelectedPelanggan] = useState(null);
  const [isUpgradingMember, setIsUpgradingMember] = useState(false);
  const [cart, setCart] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [diskonPoin, setDiskonPoin] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [catatan, setCatatan] = useState("");
  const [statusPembayaran, setStatusPembayaran] = useState("Belum Lunas");
  const [metodePembayaran, setMetodePembayaran] = useState("");
  const [bonusMerchandiseDibawa, setBonusMerchandiseDibawa] = useState(false);
  const [poinUntukDitukar, setPoinUntukDitukar] = useState(0);
  const [transaksiSuccess, setTransaksiSuccess] = useState(null);
  const [detailTransaksiSukses, setDetailTransaksiSukses] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const strukRef = useRef();
  const [allCategories, setAllCategories] = useState([]);
  const [isPoinModalOpen, setIsPoinModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [poinInput, setPoinInput] = useState("");
  const [tipeLayanan, setTipeLayanan] = useState("dine_in");
  const [jarakKm, setJarakKm] = useState("");
  const [biayaLayanan, setBiayaLayanan] = useState(0);
  const [isAlamatModalOpen, setIsAlamatModalOpen] = useState(false);
  const [alamatToEdit, setAlamatToEdit] = useState("");
  const [isStrukReady, setIsStrukReady] = useState(false);

  // Handler dan Fungsi Logika
  const handleSelectPelanggan = (pelanggan) => {
    setSelectedPelanggan(pelanggan);
    // Reset semua state transaksi
    setCart([]);
    setIsUpgradingMember(false);
    setPoinUntukDitukar(0);
    setDiskonPoin(0);
    setTipeLayanan("dine_in");
    setJarakKm("");
  };

  const handleUpgradeMember = () => {
    setIsUpgradingMember(!isUpgradingMember);
  };

  const addItemToCart = (itemToAdd, jumlah) => {
    let jumlahFinal = parseFloat(jumlah) || 1;
    if (itemToAdd.min_order && jumlahFinal < itemToAdd.min_order) {
      jumlahFinal = itemToAdd.min_order;
      toast.info("Minimal Order Diterapkan", {
        description: `Paket "${itemToAdd.name}" memiliki minimal order ${itemToAdd.min_order} ${itemToAdd.unit}.`,
      });
    }
    const existingItem = cart.find((item) => item.id === itemToAdd.id);
    if (existingItem) {
      const newJumlah = existingItem.jumlah + jumlahFinal;
      setCart(
        cart.map((item) =>
          item.id === itemToAdd.id
            ? { ...item, jumlah: newJumlah, subtotal: newJumlah * item.price }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...itemToAdd,
          jumlah: jumlahFinal,
          subtotal: jumlahFinal * itemToAdd.price,
        },
      ]);
    }
  };

  const handleRemoveFromCart = (itemId) => {
    const newCart = cart.filter((item) => item.id !== itemId);
    setCart(newCart);
  };

  const handleProsesTransaksi = async () => {
    if (!selectedPelanggan || (cart.length === 0 && !isUpgradingMember))
      return toast.error(
        "Pelanggan dan item keranjang/upgrade member tidak boleh kosong."
      );
    if (statusPembayaran === "Lunas" && !metodePembayaran)
      return toast.error("Pilih metode pembayaran.");

    setIsProcessing(true);

    const transaksiData = {
      id_pelanggan: selectedPelanggan.id,
      catatan,
      status_pembayaran: statusPembayaran,
      metode_pembayaran: statusPembayaran === "Lunas" ? metodePembayaran : null,
      items: cart.map((item) => ({ id_paket: item.id, jumlah: item.jumlah })),
      poin_ditukar: poinUntukDitukar,
      upgrade_member: isUpgradingMember,
      tipe_layanan: tipeLayanan,
      jarak_km: parseFloat(jarakKm) || 0,
      bonus_merchandise_dibawa: bonusMerchandiseDibawa,
    };

    try {
      const { data: newInvoiceCode, error } = await supabase.rpc(
        "create_new_order",
        { payload: transaksiData }
      );
      if (error) throw error;

      const { data: detailResponse, error: detailError } = await supabase
        .from("orders")
        // VVV SELECT BARU VVV
        .select(
          `
         *, 
         tipe_order, 
         pickup_date, 
         customers!inner(id, name, tipe_pelanggan, id_identitas_bisnis), 
         branches(id, name, address, phone_number), 
         order_items(*, packages(*, services(name)))  // <-- Tambah services(name)
       `
        )
        // ^^^ SELESAI ^^^
        .eq("invoice_code", newInvoiceCode)
        .eq("business_id", authState.business_id)
        .single();
      if (detailError) throw detailError;

      setDetailTransaksiSukses(detailResponse);
      setTransaksiSuccess({ invoice_code: newInvoiceCode });
      toast.success("Transaksi berhasil dibuat!");
    } catch (err) {
      toast.error("Gagal membuat transaksi: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const [loadingWA, setLoadingWA] = useState(false);

  const handleKirimWA = async () => {
    if (!detailTransaksiSukses || loadingWA) return; // <-- Tambah loadingWA
    setLoadingWA(true); // <-- Tambah ini

    try {
      // Panggilan RPC lu udah bener
      const { data, error } = await supabase.rpc("generate_wa_message", {
        payload: {
          invoice_code: detailTransaksiSukses.invoice_code,
          tipe_pesan: "struk",
        },
      });

      if (error) throw error;
      if (data.message) throw new Error(data.message);

      const { pesan, nomor_hp } = data;

      // VVV 1. TAMBAHIN "PENJAGA" ANTI CRASH VVV
      const nomorHPNormalized = (nomor_hp || "").trim();
      if (!nomorHPNormalized) {
        toast.error("Nomor HP pelanggan tidak ditemukan atau tidak valid.");
        setLoadingWA(false);
        return;
      }

      const nomorHPFormatted = nomorHPNormalized.startsWith("0")
        ? "62" + nomorHPNormalized.substring(1)
        : nomorHPNormalized;
      // ^^^ SELESAI PENJAGA ^^^

      // VVV 2. GANTI DOMAIN KE "API.WHATSAPP.COM" VVV
      const url = `https://api.whatsapp.com/send?phone=${nomorHPFormatted}&text=${encodeURIComponent(
        pesan
      )}`;
      // ^^^ SELESAI GANTI DOMAIN ^^^

      console.log("MENCOBA MEMBUKA (API):", url);
      console.log("PANJANG URL:", url.length);

      window.open(url, "_blank");
    } catch (error) {
      console.error("DEBUG kirimWA:", error); // <-- Tambah console.error
      toast.error(error.message || "Gagal membuat pesan WA.");
    } finally {
      setLoadingWA(false); // <-- Tambah ini
    }
  };

  const resetForm = () => {
    // Fungsi ini sudah bagus, tidak perlu diubah.
    setCart([]);
    setSelectedPelanggan(null);
    setCatatan("");
    setStatusPembayaran("Belum Lunas");
    setMetodePembayaran("");
    setBonusMerchandiseDibawa(false);
    setIsUpgradingMember(false);
    setDiskonPoin(0);
    setPoinUntukDitukar(0);
    setIsPoinModalOpen(false);
    setFormError("");
    setTransaksiSuccess(null);
    setDetailTransaksiSukses(null);
    navigate("/kasir", { replace: true, state: {} });
  };

  // BENERIN: Gunakan nama kolom dari "Kamus Final"
  const handlePoinSubmit = (e) => {
    e.preventDefault();
    const poin = parseInt(poinInput);
    if (!poin || poin < (authState.pengaturan?.min_points_to_redeem || 0))
      return setFormError(
        `Penukaran minimal ${
          authState.pengaturan?.min_points_to_redeem || 0
        } poin.`
      );
    if (poin > selectedPelanggan.points)
      return setFormError("Poin pelanggan tidak mencukupi.");

    const diskon = poin * (authState.pengaturan?.rupiah_per_point_redeem || 0);
    const totalBelanja =
      subtotal + (isUpgradingMember ? BIAYA_MEMBER : 0) + biayaLayanan;
    if (diskon > totalBelanja)
      return setFormError("Diskon tidak boleh melebihi total belanja.");

    setDiskonPoin(diskon);
    setPoinUntukDitukar(poin);
    setIsPoinModalOpen(false);
    setFormError("");
    setPoinInput("");
  };

  useEffect(() => {
    const newSubtotal = cart.reduce((total, item) => total + item.subtotal, 0);
    let totalBiayaLayanan = 0;

    if (authState.pengaturan?.is_delivery_service_active) {
      const {
        delivery_free_pickup_distance,
        delivery_pickup_fee,
        delivery_free_dropoff_distance,
        delivery_dropoff_fee,
      } = authState.pengaturan;
      const jarak = parseFloat(jarakKm) || 0;
      if (
        tipeLayanan.includes("jemput") &&
        jarak > delivery_free_pickup_distance
      ) {
        totalBiayaLayanan += delivery_pickup_fee;
      }
      if (
        tipeLayanan.includes("antar") &&
        jarak > delivery_free_dropoff_distance
      ) {
        totalBiayaLayanan += delivery_dropoff_fee;
      }
    }

    // KEMBALIKAN 'upgradeCost'
    const upgradeCost = isUpgradingMember ? BIAYA_MEMBER : 0;

    setSubtotal(newSubtotal);
    setBiayaLayanan(totalBiayaLayanan);

    // KEMBALIKAN 'upgradeCost' DI GRAND TOTAL
    setGrandTotal(newSubtotal + upgradeCost + totalBiayaLayanan - diskonPoin);
  }, [
    cart,
    diskonPoin,
    tipeLayanan,
    jarakKm,
    authState.pengaturan,
    isUpgradingMember, // <-- KEMBALIKAN INI
    BIAYA_MEMBER, // <-- KEMBALIKAN INI
  ]);

  // useEffect untuk mereset state saat pelanggan berubah (sudah benar)
  useEffect(() => {
    setIsUpgradingMember(false);
    setDiskonPoin(0);
    setPoinUntukDitukar(0);
  }, [selectedPelanggan]);

  // useEffect untuk mengambil data pelanggan dari state navigasi (sudah benar)
  useEffect(() => {
    // VVV Benerin di sini VVV
    if (location.state?.selectedCustomer) {
      setSelectedPelanggan(location.state.selectedCustomer);

      // Hapus state-nya biar nggak nyangkut pas di-refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
    // ^^^ Selesai ^^^
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    // Reset status kesiapan setiap kali data transaksi berubah (atau hilang)
    setIsStrukReady(false);

    if (detailTransaksiSukses) {
      // Beri jeda SANGAT SINGKAT (misal 100ms) agar komponen Struk
      // sempat render dan menempelkan dirinya ke ref.
      const timer = setTimeout(() => {
        if (strukRef.current) {
          setIsStrukReady(true); // <-- NYALAKAN SAKLAR KESIAPAN
          console.log("LOG: Komponen Struk siap, ref terpasang.");
        } else {
          console.error("ERROR: Ref struk masih kosong setelah jeda render.");
          toast.warning("Komponen struk gagal dimuat, coba refresh.");
        }
      }, 100); // Jeda 100 milidetik (bisa disesuaikan jika perlu)

      // Jangan lupa bersihkan timeout jika komponen unmount atau data berubah lagi
      return () => clearTimeout(timer);
    }
  }, [detailTransaksiSukses]);

  const handleOpenAlamatModal = () => {
    if (!selectedPelanggan) return;
    setAlamatToEdit(selectedPelanggan.address || "");
    setIsAlamatModalOpen(true);
  };

  // UPGRADE: Fungsi fetchServices sekarang pake Supabase
  const fetchServices = useCallback(async () => {
    if (!authState.business_id) return;
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*, services(*, packages(*))")
        .eq("business_id", authState.business_id);
      if (error) throw error;
      setAllCategories(data);
    } catch (error) {
      toast.error("Gagal memuat data layanan & paket.");
    }
  }, [authState.business_id]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // usePageVisibility(fetchServices);

  // UPGRADE: Fungsi update alamat sekarang pake Supabase dan anti-bocor
  const handleUpdateAlamat = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("customers")
        .update({ address: alamatToEdit })
        .eq("id", selectedPelanggan.id)
        .eq("business_id", authState.business_id) // <-- Keamanan!
        .select()
        .single();

      if (error) throw error;
      setSelectedPelanggan(data); // Update state dengan data baru yang aman
      toast.success("Alamat pelanggan berhasil diupdate!");
      setIsAlamatModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Gagal mengupdate alamat.");
    }
  };

  return (
    <div>
      {" "}
      {/* <-- Div utama halaman */}
      {!transaksiSuccess ? (
        // --- BLOK FORM INPUT TRANSAKSI ---
        <>
          <h1 className="text-3xl font-bold mb-6">Buat Transaksi Baru</h1>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-7/12 flex flex-col gap-8">
              {/* Customer Section */}
              <CustomerSection
                selectedPelanggan={selectedPelanggan}
                onSelectPelanggan={handleSelectPelanggan}
                onUpgradeMember={handleUpgradeMember}
                isPoinSystemActive={isPoinSystemActive}
                isPaidMembershipRequired={isPaidMembershipRequired}
                isUpgradingMember={isUpgradingMember}
                onOpenPoinModal={() => setIsPoinModalOpen(true)}
                pengaturan={authState.pengaturan}
              />
              {/* Service Selector */}
              <ServiceSelector
                categories={allCategories}
                onAddToCart={addItemToCart}
              />
            </div>
            <div className="lg:w-5/12">
              {/* Cart Section */}
              <Cart
                cart={cart}
                onRemoveFromCart={handleRemoveFromCart}
                onProsesTransaksi={handleProsesTransaksi}
                isProcessing={isProcessing}
                subtotal={subtotal}
                diskonPoin={diskonPoin}
                grandTotal={grandTotal}
                catatan={catatan}
                setCatatan={setCatatan}
                statusPembayaran={statusPembayaran}
                setStatusPembayaran={setStatusPembayaran}
                metodePembayaran={metodePembayaran}
                setMetodePembayaran={setMetodePembayaran}
                isPoinSystemActive={isPoinSystemActive}
                isUpgradingMember={isUpgradingMember}
                isBonusMerchandiseActive={isBonusMerchandiseActive}
                merchandiseName={merchandiseName}
                bonusMerchandiseDibawa={bonusMerchandiseDibawa}
                setBonusMerchandiseDibawa={setBonusMerchandiseDibawa}
                selectedPelanggan={selectedPelanggan}
                pengaturan={authState.pengaturan}
                tipeLayanan={tipeLayanan}
                setTipeLayanan={setTipeLayanan}
                jarakKm={jarakKm}
                setJarakKm={setJarakKm}
                biayaLayanan={biayaLayanan}
                onOpenAlamatModal={handleOpenAlamatModal}
              />
            </div>
          </div>
        </>
      ) : (
        // <-- Mulai blok: Jika transaksiSuccess = true
        // --- BLOK SUKSES TRANSAKSI (Struktur Print Benar) ---
        <>
          {" "}
          {/* <-- Bungkus dengan Fragment */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <CardTitle className="text-2xl">Transaksi Berhasil!</CardTitle>
              <CardDescription>
                Invoice {detailTransaksiSukses?.invoice_code} telah dibuat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Preview Struk di layar (TANPA ref) */}
              {detailTransaksiSukses && (
                <div className="border rounded-lg my-4 bg-muted/30 p-2">
                  <div className="max-h-64 overflow-y-auto">
                    <div className="w-[220px] mx-auto">
                      <Struk
                        // REF DIHAPUS DARI PREVIEW INI
                        transaksi={detailTransaksiSukses}
                        pengaturan={authState.pengaturan}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tombol Print & WA */}
              {detailTransaksiSukses && (
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {/* Kembali ke PrintStrukButton */}
                  <PrintStrukButton
                    componentRef={strukRef} // <-- Ref ke div tersembunyi
                    disabled={!isStrukReady}
                    // Hapus onBeforePrint atau onBeforeGetContent jika ada
                  />
                  <Button
                    onClick={handleKirimWA}
                    variant="outline"
                    className="bg-green-500 text-white hover:bg-green-600"
                    disabled={loadingWA}
                  >
                    {loadingWA ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Mengirim...
                      </>
                    ) : (
                      "Kirim WhatsApp"
                    )}
                  </Button>
                </div>
              )}

              {/* Tombol Buat Transaksi Baru */}
              <Button
                onClick={resetForm}
                variant="default"
                className="w-full mt-4"
              >
                Buat Transaksi Baru
              </Button>
            </CardContent>
          </Card>{" "}
          {/* <-- Akhir Card Sukses */}
          {/* DIV TERSEMBUNYI KHUSUS UNTUK PRINT */}
          <div
            id="struk-print-area" // <-- ID buat ditarget CSS
            ref={strukRef} // <-- Ref buat diambil react-to-print // Biarin class ini, ini udah bener buat nyembunyiin di layar
            className="absolute left-0 top-0 h-0 w-full opacity-0 pointer-events-none"
            aria-hidden="true"
          >
            {" "}
            {detailTransaksiSukses && (
              <Struk
                transaksi={detailTransaksiSukses}
                pengaturan={authState.pengaturan}
              />
            )}{" "}
          </div>
          {/* AKHIR DIV TERSEMBUNYI */}
        </> // <-- Akhir Fragment
      )}{" "}
      {/* <-- Akhir blok sukses transaksi */}
      {/* --- MODAL TUKAR POIN --- */}
      {selectedPelanggan && (
        <Dialog open={isPoinModalOpen} onOpenChange={setIsPoinModalOpen}>
          <DialogContent>
            <DialogHeader>
              {/* BENERIN: Gunakan nama kolom asli 'name' */}
              <DialogTitle>Tukar Poin: {selectedPelanggan.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePoinSubmit} className="space-y-4 py-4">
              <p className="text-muted-foreground">
                {/* BENERIN: Gunakan nama kolom asli 'points' */}
                Poin tersedia: {selectedPelanggan.points}
              </p>
              {formError && (
                <p className="text-destructive text-sm">{formError}</p>
              )}
              <div>
                <Label htmlFor="poinInput">Jumlah Poin</Label>
                <Input
                  id="poinInput"
                  type="number"
                  value={poinInput}
                  onChange={(e) => setPoinInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsPoinModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit">Terapkan Poin</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {/* --- MODAL UPDATE ALAMAT --- */}
      <Dialog open={isAlamatModalOpen} onOpenChange={setIsAlamatModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Alamat Pelanggan</DialogTitle>
            <DialogDescription>
              {/* BENERIN: Gunakan nama kolom asli 'name' */}
              Ubah alamat untuk {selectedPelanggan?.name}. Perubahan ini akan
              tersimpan permanen.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateAlamat} className="py-4">
            <Textarea
              value={alamatToEdit}
              onChange={(e) => setAlamatToEdit(e.target.value)}
              placeholder="Masukkan alamat lengkap pelanggan..."
              rows={4}
              autoFocus
            />
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAlamatModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit">Simpan Alamat</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default KasirPage;
