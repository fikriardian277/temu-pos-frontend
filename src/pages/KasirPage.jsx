// src/pages/KasirPage.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import CustomerSection from "../components/kasir/CustomerSection";
import ServiceSelector from "../components/kasir/ServiceSelector";
import Cart from "../components/kasir/Cart";
import Struk from "../components/struk/Struk";
import PrintStrukButton from "../components/struk/PrintStrukButton"; // Jangan lupa import ini
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  const [isPoinModalOpen, setIsPoinModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [poinInput, setPoinInput] = useState("");

  const BIAYA_MEMBER = authState.pengaturan?.biaya_membership || 50000;

  const handleSelectPelanggan = (pelanggan) => {
    setSelectedPelanggan(pelanggan);
    setIsUpgradingMember(false);
    setPoinUntukDitukar(0);
    setCart([]);
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
        cart.map((item) =>
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
      items: regularItems.map((item) => ({
        id_paket: item.id,
        jumlah: item.jumlah,
      })),
      poin_ditukar: poinUntukDitukar,
      bonus_merchandise_dibawa: bonusMerchandiseDibawa,
      upgrade_member: isUpgradingMember,
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

  const handleKirimWA = () => {
    if (!detailTransaksiSukses) return;
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
    } = detailTransaksiSukses;

    const subtotal = Pakets.reduce(
      (total, item) => total + item.DetailTransaksi.subtotal,
      0
    );

    let pesan = `*Struk Digital Laundry*\n\n`;
    pesan += `Invoice: *${kode_invoice}*\n`;
    pesan += `Pelanggan: ${Pelanggan.nama}\n`;
    pesan += `Tanggal: ${new Date(createdAt).toLocaleString("id-ID")}\n`;
    pesan += `-----------------------\n`;
    Pakets.forEach((p) => {
      pesan += `${p.Layanan.nama_layanan} - ${p.nama_paket}\n`;
      pesan += `${p.DetailTransaksi.jumlah} ${
        p.satuan
      } x Rp ${p.harga.toLocaleString(
        "id-ID"
      )} = *Rp ${p.DetailTransaksi.subtotal.toLocaleString("id-ID")}*\n\n`;
    });
    pesan += `-----------------------\n`;
    pesan += `Subtotal: Rp ${subtotal.toLocaleString("id-ID")}\n`;
    if (poin_digunakan > 0) {
      const diskon =
        poin_digunakan * (authState.pengaturan?.rupiah_per_poin_redeem || 0);
      pesan += `Diskon Poin: - Rp ${diskon.toLocaleString("id-ID")}\n`;
    }
    pesan += `*GRAND TOTAL: Rp ${grand_total.toLocaleString("id-ID")}*\n`;
    pesan += `Status: *${status_pembayaran}*\n\n`;
    if (Pelanggan.status_member === "Aktif") {
      pesan += `--- Info Poin ---\n`;
      pesan += `Poin Ditukar: -${poin_digunakan}\n`;
      pesan += `Poin Didapat: +${poin_didapat}\n`;
      pesan += `Poin Sekarang: *${Pelanggan.poin}*\n\n`;
    }
    if (catatan) {
      pesan += `--- Catatan ---\n`;
      pesan += `${catatan}\n\n`;
    }
    pesan += `Terima kasih!`;

    const nomorHP = Pelanggan.nomor_hp.startsWith("0")
      ? "62" + Pelanggan.nomor_hp.substring(1)
      : Pelanggan.nomor_hp;
    const url = `https://wa.me/${nomorHP}?text=${encodeURIComponent(pesan)}`;
    window.open(url, "_blank");
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
    setGrandTotal(newSubtotal - diskonPoin);
  }, [cart, diskonPoin]);

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
              />
              <ServiceSelector onAddToCart={addItemToCart} />
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
            <div className="border rounded-lg my-4 bg-muted/30 p-2">
              <div className="max-h-64 overflow-y-auto">
                <div className="w-[220px] mx-auto">
                  <Struk transaksi={detailTransaksiSukses} />
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <PrintStrukButton transaksi={detailTransaksiSukses} />
              <Button
                onClick={handleKirimWA}
                variant="outline"
                className="bg-green-500 text-white hover:bg-green-600"
              >
                Kirim WhatsApp
              </Button>
            </div>
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
    </div>
  );
}

export default KasirPage;
