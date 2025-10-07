// src/pages/KasirPage.jsx

import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import CustomerSection from "../components/kasir/CustomerSection";
import ServiceSelector from "../components/kasir/ServiceSelector.jsx";
import Cart from "../components/kasir/Cart";
import Struk from "../components/struk/Struk";
import PrintStrukButton from "../components/struk/PrintStrukButton"; // Jangan lupa import ini
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
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

  const isPoinSystemActive =
    authState.pengaturan?.skema_poin_aktif !== "nonaktif";
  const isPaidMembershipRequired =
    authState.pengaturan?.wajib_membership_berbayar;
  const isBonusMerchandiseActive =
    authState.pengaturan?.apakah_bonus_merchandise_aktif;
  const merchandiseName =
    authState.pengaturan?.nama_merchandise || "Merchandise";

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

  const [allKategoriData, setAllKategoriData] = useState([]); // Untuk menyimpan data mentah dari API
  const [kategoriOptions, setKategoriOptions] = useState([]); // Untuk dropdown Kategori
  const [layananOptions, setLayananOptions] = useState([]); // Untuk dropdown Layanan
  const [paketOptions, setPaketOptions] = useState([]); // Untuk dropdown Paket

  const [isPoinModalOpen, setIsPoinModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [poinInput, setPoinInput] = useState("");

  const [tipeLayanan, setTipeLayanan] = useState("dine_in");
  const [jarakKm, setJarakKm] = useState("");
  const [biayaLayanan, setBiayaLayanan] = useState(0);
  const [isAlamatModalOpen, setIsAlamatModalOpen] = useState(false);
  const [alamatToEdit, setAlamatToEdit] = useState("");

  const BIAYA_MEMBER = authState.pengaturan?.biaya_membership || 50000;

  const handleSelectPelanggan = (pelanggan) => {
    setSelectedPelanggan(pelanggan);
    // Reset state terkait transaksi sebelumnya
    setIsUpgradingMember(false);
    setPoinUntukDitukar(0);
    setCart([]);
    // Reset juga pilihan layanan
    setTipeLayanan("dine_in");
    setJarakKm("");
  };

  const handleUpgradeMember = () => {
    const sudahAdaBiayaMember = cart.some((item) => item.id === "member-fee");
    if (!sudahAdaBiayaMember) {
      setCart([
        ...cart,
        {
          id: "member-fee",
          nama_paket: "Biaya Upgrade Membership",
          harga: BIAYA_MEMBER,
          jumlah: 1,
          satuan: "pcs",
          subtotal: BIAYA_MEMBER,
        },
      ]);
      setIsUpgradingMember(true);
    }
  };

  const addItemToCart = (itemToAdd, jumlah) => {
    let jumlahFinal = jumlah;
    if (itemToAdd.minimal_order && jumlah < itemToAdd.minimal_order) {
      jumlahFinal = itemToAdd.minimal_order;
      toast.info("Minimal Order Diterapkan", {
        description: `Paket "${itemToAdd.nama_paket}" memiliki minimal order ${itemToAdd.minimal_order} ${itemToAdd.satuan}. Jumlah otomatis disesuaikan.`,
      });
    }
    const existingItem = cart.find((item) => item.id === itemToAdd.id);
    if (existingItem) {
      const newJumlah = existingItem.jumlah + jumlahFinal;
      setCart(
        cart?.map((item) =>
          item.id === itemToAdd.id
            ? { ...item, jumlah: newJumlah, subtotal: newJumlah * item.harga }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...itemToAdd,
          jumlah: jumlahFinal,
          subtotal: jumlahFinal * itemToAdd.harga,
        },
      ]);
    }
  };

  const handleRemoveFromCart = (itemId) => {
    const newCart = cart.filter((item) => item.id !== itemId);
    if (itemId === "member-fee") setIsUpgradingMember(false);
    setCart(newCart);
  };

  const handleProsesTransaksi = async () => {
    if (!selectedPelanggan || cart.length === 0)
      return toast.error("Pelanggan dan item keranjang tidak boleh kosong.");
    if (statusPembayaran === "Lunas" && !metodePembayaran)
      return toast.error("Pilih metode pembayaran.");
    setIsProcessing(true);
    const regularItems = cart.filter((item) => item.id !== "member-fee");
    const transaksiData = {
      id_pelanggan: selectedPelanggan.id,
      catatan,
      status_pembayaran: statusPembayaran,
      metode_pembayaran: statusPembayaran === "Lunas" ? metodePembayaran : null,
      items: regularItems?.map((item) => ({
        id_paket: item.id,
        jumlah: item.jumlah,
      })),
      poin_ditukar: poinUntukDitukar,
      bonus_merchandise_dibawa: bonusMerchandiseDibawa,
      upgrade_member: isUpgradingMember,
      tipe_layanan: tipeLayanan,
      jarak_km: parseFloat(jarakKm) || 0,
    };
    try {
      const response = await api.post("/transaksi", transaksiData);
      const detailResponse = await api.get(
        `/transaksi/${response.data.data.kode_invoice}`
      );
      setDetailTransaksiSukses(detailResponse.data);
      setTransaksiSuccess(response.data.data);
      toast.success("Transaksi berhasil dibuat!");
    } catch (err) {
      toast.error(
        "Gagal membuat transaksi: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKirimWA = async () => {
    if (!detailTransaksiSukses) return;
    try {
      // Minta pesan dari backend
      const response = await api.post("/transaksi/generate-wa-message", {
        kode_invoice: detailTransaksiSukses.kode_invoice,
        tipe_pesan: "struk",
      });

      const { pesan, nomor_hp } = response.data;

      // Buka link WhatsApp dengan pesan dari backend
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
    if (!poin || poin < (authState.pengaturan?.minimal_penukaran_poin || 10))
      return setFormError(
        `Penukaran minimal ${
          authState.pengaturan?.minimal_penukaran_poin || 10
        } poin.`
      );
    if (poin > selectedPelanggan.poin)
      return setFormError("Poin pelanggan tidak mencukupi.");

    const diskon = poin * (authState.pengaturan?.rupiah_per_poin_redeem || 0);
    if (diskon >= subtotal)
      return setFormError("Diskon tidak boleh melebihi subtotal.");

    setDiskonPoin(diskon);
    setPoinUntukDitukar(poin);
    setIsPoinModalOpen(false);
    setFormError("");
    setPoinInput("");
  };

  useEffect(() => {
    const newSubtotal = cart.reduce((total, item) => total + item.subtotal, 0);
    setSubtotal(newSubtotal);
    // [FIX] Tambahkan biayaLayanan ke dalam grand total
    setGrandTotal(newSubtotal - diskonPoin + biayaLayanan);
  }, [cart, diskonPoin, biayaLayanan]); // <-- Jangan lupa tambahkan biayaLayanan di sini

  useEffect(() => {
    setIsUpgradingMember(false);
    setDiskonPoin(0);
    setPoinUntukDitukar(0);
  }, [selectedPelanggan]);

  useEffect(() => {
    if (location.state?.pelangganTerpilih) {
      setSelectedPelanggan(location.state.pelangganTerpilih);
    }
  }, [location.state]);

  useEffect(() => {
    if (!authState.pengaturan?.layanan_antar_jemput_aktif) {
      setBiayaLayanan(0);
      return;
    }

    const {
      batas_jarak_gratis_jemput,
      biaya_jemput_jarak,
      batas_jarak_gratis_antar,
      biaya_antar_jarak,
    } = authState.pengaturan;

    const jarak = parseFloat(jarakKm) || 0;
    let biayaJemput = 0;
    let biayaAntar = 0;

    // Hitung biaya jemput
    if (tipeLayanan === "jemput" || tipeLayanan === "antar_jemput") {
      if (jarak > batas_jarak_gratis_jemput) {
        biayaJemput = biaya_jemput_jarak;
      }
    }

    // Hitung biaya antar
    if (tipeLayanan === "antar" || tipeLayanan === "antar_jemput") {
      if (jarak > batas_jarak_gratis_antar) {
        biayaAntar = biaya_antar_jarak;
      }
    }

    setBiayaLayanan(biayaJemput + biayaAntar);
  }, [tipeLayanan, jarakKm, authState.pengaturan]);

  const handleOpenAlamatModal = () => {
    if (!selectedPelanggan) return;
    setAlamatToEdit(selectedPelanggan.alamat || "");
    setIsAlamatModalOpen(true);
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get("/layanan"); // Endpoint yang mengembalikan Kategori > Layanan > Paket
        setAllKategoriData(response.data);
        setKategoriOptions(response.data); // Langsung set untuk pilihan Kategori awal
      } catch (error) {
        toast.error("Gagal memuat data layanan & paket.");
      }
    };
    fetchServices();
  }, []);

  const handleKategoriChange = (kategoriId) => {
    const selectedKategori = allKategoriData.find(
      (k) => k.id === parseInt(kategoriId)
    );

    if (selectedKategori) {
      setLayananOptions(selectedKategori.layanans || []);
    } else {
      setLayananOptions([]);
    }
    // Reset pilihan paket setiap kali kategori berubah
    setPaketOptions([]);
  };

  const handleLayananChange = (layananId) => {
    // Cari layanan yang dipilih di dalam data yang kita punya
    for (const kategori of allKategoriData) {
      const selectedLayanan = kategori.layanans?.find(
        (l) => l.id === parseInt(layananId)
      );
      if (selectedLayanan) {
        setPaketOptions(selectedLayanan.pakets || []);
        break; // Hentikan loop jika sudah ketemu
      }
    }
  };

  // [BARU] Fungsi untuk mengirim update alamat ke backend
  const handleUpdateAlamat = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/pelanggan/${selectedPelanggan.id}`, {
        alamat: alamatToEdit,
      });
      // Update state pelanggan yang dipilih dengan data terbaru dari server
      setSelectedPelanggan(response.data.data);
      toast.success("Alamat pelanggan berhasil diupdate!");
      setIsAlamatModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengupdate alamat.");
    }
  };

  return (
    <div>
      {!transaksiSuccess ? (
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
                kategoriOptions={kategoriOptions}
                layananOptions={layananOptions}
                paketOptions={paketOptions}
                onKategoriChange={handleKategoriChange}
                onLayananChange={handleLayananChange}
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
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <CardTitle className="text-2xl">Transaksi Berhasil!</CardTitle>
            <CardDescription>
              Invoice {detailTransaksiSukses?.kode_invoice} telah dibuat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* --- BAGIAN INI YANG BERUBAH --- */}
            <div className="border rounded-lg my-4 bg-muted/30 p-2">
              <div className="max-h-64 overflow-y-auto">
                <div className="w-[220px] mx-auto">
                  {/* Beri penanda (ref) ke komponen Struk */}
                  <Struk ref={strukRef} transaksi={detailTransaksiSukses} />
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {/* Kirim penanda (ref) ke tombol Print */}
              <PrintStrukButton
                componentRef={strukRef}
                disabled={!detailTransaksiSukses}
              />
              <Button
                onClick={handleKirimWA}
                variant="outline"
                className="bg-green-500 text-white hover:bg-green-600"
              >
                Kirim WhatsApp
              </Button>
            </div>
            {/* --- AKHIR DARI BAGIAN YANG BERUBAH --- */}
            <Button
              onClick={resetForm}
              variant="default"
              className="w-full mt-4"
            >
              Buat Transaksi Baru
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedPelanggan && (
        <Dialog open={isPoinModalOpen} onOpenChange={setIsPoinModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tukar Poin: {selectedPelanggan.nama}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePoinSubmit} className="space-y-4 py-4">
              <p className="text-muted-foreground">
                Poin tersedia: {selectedPelanggan.poin}
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
      <Dialog open={isAlamatModalOpen} onOpenChange={setIsAlamatModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Alamat Pelanggan</DialogTitle>
            <DialogDescription>
              Ubah alamat untuk {selectedPelanggan?.nama}. Perubahan ini akan
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
