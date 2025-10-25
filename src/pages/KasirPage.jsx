// src/pages/KasirPage.jsx (VERSI AWAL PRINT)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
// import { usePageVisibility } from "@/lib/usePageVisibility.js"; // Dihapus

// Komponen & Ikon
import CustomerSection from "../components/kasir/CustomerSection";
import ServiceSelector from "../components/kasir/ServiceSelector.jsx";
import Cart from "../components/kasir/Cart";
import Struk from "../components/struk/Struk";
import PrintStrukButton from "../components/struk/PrintStrukButton";
import { CheckCircle, Loader2, Printer } from "lucide-react"; // Pastikan Printer diimport
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

function KasirPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authState } = useAuth();

  // Pengaturan
  const isPoinSystemActive = authState.pengaturan?.points_scheme !== "nonaktif";
  const isPaidMembershipRequired =
    authState.pengaturan?.require_paid_membership;
  const isBonusMerchandiseActive = authState.pengaturan?.is_merch_bonus_active;
  const merchandiseName =
    authState.pengaturan?.merch_bonus_name || "Merchandise";
  const BIAYA_MEMBER = authState.pengaturan?.membership_fee || 0;

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
  const strukRef = useRef(null); // <-- Ref untuk struk preview
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
  const [loadingWA, setLoadingWA] = useState(false);

  // --- Fungsi Handler & Logika ---
  const handleSelectPelanggan = (pelanggan) => {
    setSelectedPelanggan(pelanggan);
    setCart([]);
    setIsUpgradingMember(false);
    setPoinUntukDitukar(0);
    setDiskonPoin(0);
    setTipeLayanan("dine_in");
    setJarakKm("");
  };

  const handleUpgradeMember = () => setIsUpgradingMember(!isUpgradingMember);

  const addItemToCart = (itemToAdd, jumlah) => {
    let jumlahFinal = parseFloat(jumlah) || 1;
    if (itemToAdd.min_order && jumlahFinal < itemToAdd.min_order) {
      jumlahFinal = itemToAdd.min_order;
      toast.info("Minimal Order Diterapkan", {
        description: `Paket "${itemToAdd.name}" min. order ${itemToAdd.min_order} ${itemToAdd.unit}.`,
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

  const handleRemoveFromCart = (itemId) =>
    setCart(cart.filter((item) => item.id !== itemId));

  const handleProsesTransaksi = async () => {
    if (!selectedPelanggan || (cart.length === 0 && !isUpgradingMember))
      return toast.error("Pelanggan dan item/upgrade tidak boleh kosong.");
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
        .select(
          `*, tipe_order, pickup_date, customers!inner(id, name, tipe_pelanggan, id_identitas_bisnis), branches(id, name, address, phone_number), order_items(*, packages(*, services(name)))`
        )
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

  const handleKirimWA = async () => {
    if (!detailTransaksiSukses || loadingWA) return;
    setLoadingWA(true);
    try {
      const { data, error } = await supabase.rpc("generate_wa_message", {
        payload: {
          invoice_code: detailTransaksiSukses.invoice_code,
          tipe_pesan: "struk",
        },
      });
      if (error || data.message) throw error || new Error(data.message);
      const { pesan, nomor_hp } = data;
      const nomorHPNormalized = (nomor_hp || "").trim();
      if (!nomorHPNormalized) {
        toast.error("Nomor HP tidak valid.");
        setLoadingWA(false);
        return;
      }
      const nomorHPFormatted = nomorHPNormalized.startsWith("0")
        ? "62" + nomorHPNormalized.substring(1)
        : nomorHPNormalized;
      const url = `https://api.whatsapp.com/send?phone=${nomorHPFormatted}&text=${encodeURIComponent(
        pesan
      )}`;
      window.open(url, "_blank");
    } catch (error) {
      toast.error(error.message || "Gagal membuat pesan WA.");
    } finally {
      setLoadingWA(false);
    }
  };

  const resetForm = () => {
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

  const handlePoinSubmit = (e) => {
    e.preventDefault();
    const poin = parseInt(poinInput);
    if (!poin || poin < (authState.pengaturan?.min_points_to_redeem || 0))
      return setFormError(
        `Min. ${authState.pengaturan?.min_points_to_redeem || 0} poin.`
      );
    if (poin > selectedPelanggan.points)
      return setFormError("Poin tidak cukup.");
    const diskon = poin * (authState.pengaturan?.rupiah_per_point_redeem || 0);
    const totalBelanja =
      subtotal + (isUpgradingMember ? BIAYA_MEMBER : 0) + biayaLayanan;
    if (diskon > totalBelanja)
      return setFormError("Diskon melebihi total belanja.");
    setDiskonPoin(diskon);
    setPoinUntukDitukar(poin);
    setIsPoinModalOpen(false);
    setFormError("");
    setPoinInput("");
  };

  // Kalkulasi total
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
    const upgradeCost = isUpgradingMember ? BIAYA_MEMBER : 0;
    setSubtotal(newSubtotal);
    setBiayaLayanan(totalBiayaLayanan);
    setGrandTotal(newSubtotal + upgradeCost + totalBiayaLayanan - diskonPoin);
  }, [
    cart,
    diskonPoin,
    tipeLayanan,
    jarakKm,
    authState.pengaturan,
    isUpgradingMember,
    BIAYA_MEMBER,
  ]);

  // Reset state saat pelanggan berubah
  useEffect(() => {
    setIsUpgradingMember(false);
    setDiskonPoin(0);
    setPoinUntukDitukar(0);
  }, [selectedPelanggan]);

  // Ambil data dari navigasi
  useEffect(() => {
    if (location.state?.selectedCustomer) {
      setSelectedPelanggan(location.state.selectedCustomer);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // Cek kesiapan struk (Pake jeda & cek innerHTML)
  useEffect(() => {
    setIsStrukReady(false);
    if (detailTransaksiSukses) {
      let attempts = 0;
      const maxAttempts = 10;
      const interval = 300;

      const checkStrukRender = () => {
        attempts++;
        const strukElement = strukRef.current;

        if (strukElement && strukElement.innerHTML.trim() !== "") {
          console.log(
            `STRUK READY CHECK (Percobaan ${attempts}): OK. Siap print.`
          );
          setIsStrukReady(true);
        } else if (attempts >= maxAttempts) {
          console.error("ERROR: Ref struk TETAP kosong setelah 3 detik.");
          toast.error("Gagal memuat struk untuk dicetak. Coba refresh.");
        } else {
          console.log(
            `STRUK READY CHECK (Percobaan ${attempts}): Belum siap, coba lagi...`
          );
          setTimeout(checkStrukRender, interval);
        }
      };
      setTimeout(checkStrukRender, interval);
    }
  }, [detailTransaksiSukses]);

  // Fetch services
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
      toast.error("Gagal memuat layanan.");
    }
  }, [authState.business_id]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // handleOpenAlamatModal
  const handleOpenAlamatModal = () => {
    if (!selectedPelanggan) return;
    setAlamatToEdit(selectedPelanggan.address || "");
    setIsAlamatModalOpen(true);
  };

  // handleUpdateAlamat
  const handleUpdateAlamat = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("customers")
        .update({ address: alamatToEdit })
        .eq("id", selectedPelanggan.id)
        .eq("business_id", authState.business_id)
        .select()
        .single();
      if (error) throw error;
      setSelectedPelanggan(data);
      toast.success("Alamat diupdate!");
      setIsAlamatModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Gagal update alamat.");
    }
  };

  // --- Mulai JSX Render ---
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
              <ServiceSelector
                categories={allCategories}
                onAddToCart={addItemToCart}
              />
            </div>
            <div className="lg:w-5/12">
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
        // --- BLOK SUKSES TRANSAKSI (Struktur Print Asli) ---
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <CardTitle className="text-2xl">Transaksi Berhasil!</CardTitle>
            <CardDescription>
              Invoice {detailTransaksiSukses?.invoice_code} telah dibuat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Preview Struk di layar (DENGAN ref) */}
            {detailTransaksiSukses && (
              <div className="border rounded-lg my-4 bg-muted/30 p-2">
                <div className="max-h-64 overflow-y-auto">
                  <div className="w-[220px] mx-auto">
                    {/* VVV REF DIPASANG DI SINI VVV */}
                    <Struk
                      ref={strukRef} // <-- Ref LANGSUNG di Struk preview
                      transaksi={detailTransaksiSukses}
                      pengaturan={authState.pengaturan}
                    />
                    {/* ^^^ SELESAI ^^^ */}
                  </div>
                </div>
              </div>
            )}

            {/* Tombol Print & WA */}
            {detailTransaksiSukses && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <PrintStrukButton
                  componentRef={strukRef} // <-- Ref ke Struk preview
                  disabled={!isStrukReady}
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
        </Card> // <-- Akhir Card Sukses

        // TIDAK ADA DIV TERSEMBUNYI
      )}{" "}
      {/* <-- Akhir blok sukses transaksi */}
      {/* --- MODAL TUKAR POIN --- */}
      {selectedPelanggan && (
        <Dialog open={isPoinModalOpen} onOpenChange={setIsPoinModalOpen}>
          <DialogContent>
            {" "}
            <DialogHeader>
              {" "}
              <DialogTitle>
                Tukar Poin: {selectedPelanggan.name}
              </DialogTitle>{" "}
            </DialogHeader>{" "}
            <form onSubmit={handlePoinSubmit} className="space-y-4 py-4">
              {" "}
              <p className="text-muted-foreground">
                {" "}
                Poin tersedia: {selectedPelanggan.points}{" "}
              </p>{" "}
              {formError && (
                <p className="text-destructive text-sm">{formError}</p>
              )}{" "}
              <div>
                {" "}
                <Label htmlFor="poinInput">Jumlah Poin</Label>{" "}
                <Input
                  id="poinInput"
                  type="number"
                  value={poinInput}
                  onChange={(e) => setPoinInput(e.target.value)}
                  required
                  autoFocus
                />{" "}
              </div>{" "}
              <DialogFooter>
                {" "}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsPoinModalOpen(false)}
                >
                  {" "}
                  Batal{" "}
                </Button>{" "}
                <Button type="submit">Terapkan Poin</Button>{" "}
              </DialogFooter>{" "}
            </form>{" "}
          </DialogContent>
        </Dialog>
      )}
      {/* --- MODAL UPDATE ALAMAT --- */}
      <Dialog open={isAlamatModalOpen} onOpenChange={setIsAlamatModalOpen}>
        <DialogContent>
          {" "}
          <DialogHeader>
            {" "}
            <DialogTitle>Update Alamat Pelanggan</DialogTitle>{" "}
            <DialogDescription>
              {" "}
              Ubah alamat untuk {selectedPelanggan?.name}. Perubahan ini akan
              tersimpan permanen.{" "}
            </DialogDescription>{" "}
          </DialogHeader>{" "}
          <form onSubmit={handleUpdateAlamat} className="py-4">
            {" "}
            <Textarea
              value={alamatToEdit}
              onChange={(e) => setAlamatToEdit(e.target.value)}
              placeholder="Masukkan alamat lengkap pelanggan..."
              rows={4}
              autoFocus
            />{" "}
            <DialogFooter className="mt-4">
              {" "}
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAlamatModalOpen(false)}
              >
                {" "}
                Batal{" "}
              </Button>{" "}
              <Button type="submit">Simpan Alamat</Button>{" "}
            </DialogFooter>{" "}
          </form>{" "}
        </DialogContent>
      </Dialog>
    </div> // <-- Akhir div utama halaman
  );
} // <-- Akhir function KasirPage

export default KasirPage;
