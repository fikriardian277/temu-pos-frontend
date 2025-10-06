// src/pages/PengaturanUsahaPage.jsx

import React, { useState, useEffect, useRef } from "react";
import api from "@/api/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Impor komponen
import { Button } from "@/components/ui/Button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.jsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import VariableBadge from "@/components/VariableBadge";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.jsx";

function PengaturanUsahaPage() {
  const { authState, login } = useAuth();
  const [settings, setSettings] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTextarea, setActiveTextarea] = useState({
    name: null,
    ref: null,
  });

  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    nextScheme: null, // Untuk menyimpan pilihan skema berikutnya
  });

  const waHeaderRef = useRef(null);
  const waStrukPembukaRef = useRef(null);
  const waStrukPenutupRef = useRef(null);
  const waSiapDiambilPembukaRef = useRef(null);
  const waSiapDiambilPenutupRef = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get("/pengaturan");
        setSettings(response.data);
        if (response.data.logo_url) {
          setLogoPreview(response.data.logo_url);
        }
      } catch (err) {
        toast.error("Gagal memuat pengaturan.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInsertVariable = (variable) => {
    // Cek apakah ada textarea yang aktif
    if (!activeTextarea.name || !activeTextarea.ref?.current) {
      toast.warning("Klik dulu di dalam kotak pesan sebelum memilih variabel.");
      return;
    }

    const textarea = activeTextarea.ref.current;
    const currentText = textarea.value || "";
    const cursorPos = textarea.selectionStart;

    // Gabungkan teks: bagian awal + variabel + bagian akhir
    const newText =
      currentText.substring(0, cursorPos) +
      variable +
      currentText.substring(cursorPos);

    // Update state settings
    setSettings((prev) => ({ ...prev, [activeTextarea.name]: newText }));

    // Fokus kembali ke textarea setelah menyisipkan teks
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = cursorPos + variable.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckedChange = (name, checked) => {
    setSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSkemaChange = (value) => {
    // Jika user memilih skema yang berbeda dari yang sekarang
    if (value !== settings.skema_poin_aktif) {
      // Buka modal dan simpan pilihan berikutnya
      setConfirmationModal({ isOpen: true, nextScheme: value });
    }
  };
  const handleConfirmSkemaChange = () => {
    if (confirmationModal.nextScheme) {
      setSettings((prev) => ({
        ...prev,
        skema_poin_aktif: confirmationModal.nextScheme,
      }));
    }
    // Tutup modal
    setConfirmationModal({ isOpen: false, nextScheme: null });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalSettings = { ...settings };
      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        const uploadResponse = await api.post(
          "/pengaturan/upload-logo",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        finalSettings.logo_url = uploadResponse.data.data.logo_url;
      }
      const response = await api.put("/pengaturan", finalSettings);
      const token = localStorage.getItem("accessToken");
      if (token) await login(token);
      toast.success(response.data.message || "Pengaturan berhasil disimpan!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleUseDefaultTemplate = (type) => {
    if (type === "struk") {
      setSettings((prev) => ({
        ...prev,
        wa_header: "*Struk Digital Superclean Laundry*",
        wa_struk_pembuka:
          "Halo Kak {nama_pelanggan}! 👋\nTerima kasih telah laundry di tempat kami. Berikut rincian transaksinya:",
        wa_struk_penutup:
          "Mohon simpan struk digital ini sebagai bukti transaksi.\nDitunggu kedatangannya kembali ya! 😊",
      }));
      toast.info("Template struk default telah dimuat.");
    } else if (type === "siap_diambil") {
      setSettings((prev) => ({
        ...prev,
        wa_siap_diambil_pembuka:
          "Halo Kak {nama_pelanggan}! ✨\nKabar gembira! Cucian Anda dengan invoice *{kode_invoice}* sudah selesai diproses, bersih, wangi, dan siap untuk diambil.",
        wa_siap_diambil_penutup:
          "Kami tunggu kedatangannya di outlet kami ya.\nTerima kasih!",
      }));
      toast.info("Template pesan 'Siap Diambil' default telah dimuat.");
    }
  };

  if (loading) return <p className="text-center">Memuat pengaturan...</p>;
  if (!settings)
    return <p className="text-center">Data pengaturan tidak ditemukan.</p>;
  if (authState.user.role !== "owner")
    return (
      <p className="text-center">
        Hanya Owner yang dapat mengakses halaman ini.
      </p>
    );

  const isPoinSystemActive = settings.skema_poin_aktif !== "nonaktif";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pengaturan Usaha</h1>
          <p className="text-muted-foreground">
            Sesuaikan semua aspek bisnismu dari sini.
          </p>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Semua Perubahan"}
        </Button>
      </div>

      <Tabs defaultValue="poin" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profil">Profil & Struk</TabsTrigger>
          <TabsTrigger value="poin">Poin & Member</TabsTrigger>
          <TabsTrigger value="operasional">Operasional</TabsTrigger>
        </TabsList>

        <TabsContent value="profil">
          <Card>
            <CardHeader>
              <CardTitle>Profil Usaha & Branding</CardTitle>
              <CardDescription>
                Informasi ini akan muncul di struk.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nama_usaha">Nama Usaha</Label>
                <Input
                  id="nama_usaha"
                  name="nama_usaha"
                  value={settings.nama_usaha || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="alamat_usaha">Alamat Usaha</Label>
                <Textarea
                  id="alamat_usaha"
                  name="alamat_usaha"
                  value={settings.alamat_usaha || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="telepon_usaha">Nomor Telepon</Label>
                <Input
                  id="telepon_usaha"
                  name="telepon_usaha"
                  value={settings.telepon_usaha || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label>Logo Usaha</Label>
                <div className="flex items-center gap-4 mt-2">
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="w-20 h-20 rounded-md object-cover bg-muted"
                    />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              <div className="pt-4 space-y-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tampilkan_logo_di_struk"
                    name="tampilkan_logo_di_struk"
                    checked={settings.tampilkan_logo_di_struk}
                    onCheckedChange={(checked) =>
                      handleCheckedChange("tampilkan_logo_di_struk", checked)
                    }
                  />
                  <Label htmlFor="tampilkan_logo_di_struk">
                    Tampilkan Logo di Struk
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tampilkan_header_di_struk"
                    name="tampilkan_header_di_struk"
                    checked={settings.tampilkan_header_di_struk}
                    onCheckedChange={(checked) =>
                      handleCheckedChange("tampilkan_header_di_struk", checked)
                    }
                  />
                  <Label htmlFor="tampilkan_header_di_struk">
                    Tampilkan Info Usaha (Header) di Struk
                  </Label>
                </div>
              </div>
              <div>
                <Label htmlFor="struk_footer_text">Teks Footer Struk</Label>
                <Input
                  id="struk_footer_text"
                  name="struk_footer_text"
                  value={settings.struk_footer_text || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-1">
                  Kustomisasi Pesan WhatsApp
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Atur template pesan yang akan otomatis terisi saat kasir
                  menekan tombol "Kirim WA".
                </p>

                <div className="text-sm p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg mb-4">
                  <strong>Tips:</strong> Klik di dalam kotak pesan di mana Anda
                  ingin menambahkan variabel, lalu klik `Badge` variabel di
                  bawahnya untuk menyisipkannya secara otomatis.
                </div>

                {/* --- Template Struk Digital --- */}
                <div className="p-4 border bg-muted/50 rounded-lg space-y-4 mb-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">
                      Template Pesan Struk Digital
                    </Label>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => handleUseDefaultTemplate("struk")}
                    >
                      Gunakan Default
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor="wa_header">Header Pesan</Label>
                    <Input
                      ref={waHeaderRef}
                      id="wa_header"
                      name="wa_header"
                      value={settings.wa_header || ""}
                      onChange={handleChange}
                      onFocus={() =>
                        setActiveTextarea({
                          name: "wa_header",
                          ref: waHeaderRef,
                        })
                      }
                      placeholder="Contoh: *Struk Digital Laundry Anda*"
                    />
                  </div>
                  <div>
                    <Label htmlFor="wa_struk_pembuka">Pesan Pembuka</Label>
                    <Textarea
                      ref={waStrukPembukaRef}
                      id="wa_struk_pembuka"
                      name="wa_struk_pembuka"
                      value={settings.wa_struk_pembuka || ""}
                      onChange={handleChange}
                      onFocus={() =>
                        setActiveTextarea({
                          name: "wa_struk_pembuka",
                          ref: waStrukPembukaRef,
                        })
                      }
                      rows={3}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <VariableBadge
                        label="Nama Pelanggan"
                        value="{nama_pelanggan}"
                        onInsert={handleInsertVariable}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Bagian Paten (Tidak bisa diubah)</Label>
                    <div className="text-xs p-3 bg-background rounded-md text-muted-foreground italic">
                      [Rincian Invoice, Detail Item, Grand Total, dan Info Poin
                      akan otomatis dibuat oleh sistem di sini]
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="wa_struk_penutup">Pesan Penutup</Label>
                    <Textarea
                      ref={waStrukPenutupRef}
                      id="wa_struk_penutup"
                      name="wa_struk_penutup"
                      value={settings.wa_struk_penutup || ""}
                      onChange={handleChange}
                      onFocus={() =>
                        setActiveTextarea({
                          name: "wa_struk_penutup",
                          ref: waStrukPenutupRef,
                        })
                      }
                      rows={3}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <VariableBadge
                        label="Kode Invoice"
                        value="{kode_invoice}"
                        onInsert={handleInsertVariable}
                      />
                      <VariableBadge
                        label="Total Belanja"
                        value="{total_belanja}"
                        onInsert={handleInsertVariable}
                      />
                    </div>
                  </div>
                </div>

                {/* --- Template Siap Diambil --- */}
                <div className="p-4 border bg-muted/50 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">
                      Template Pesan Siap Diambil
                    </Label>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => handleUseDefaultTemplate("siap_diambil")}
                    >
                      Gunakan Default
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor="wa_siap_diambil_pembuka">
                      Pesan Pembuka
                    </Label>
                    <Textarea
                      ref={waSiapDiambilPembukaRef}
                      id="wa_siap_diambil_pembuka"
                      name="wa_siap_diambil_pembuka"
                      value={settings.wa_siap_diambil_pembuka || ""}
                      onChange={handleChange}
                      onFocus={() =>
                        setActiveTextarea({
                          name: "wa_siap_diambil_pembuka",
                          ref: waSiapDiambilPembukaRef,
                        })
                      }
                      rows={4}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <VariableBadge
                        label="Nama Pelanggan"
                        value="{nama_pelanggan}"
                        onInsert={handleInsertVariable}
                      />
                      <VariableBadge
                        label="Kode Invoice"
                        value="{kode_invoice}"
                        onInsert={handleInsertVariable}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="wa_siap_diambil_penutup">
                      Pesan Penutup
                    </Label>
                    <Textarea
                      ref={waSiapDiambilPenutupRef}
                      id="wa_siap_diambil_penutup"
                      name="wa_siap_diambil_penutup"
                      value={settings.wa_siap_diambil_penutup || ""}
                      onChange={handleChange}
                      onFocus={() =>
                        setActiveTextarea({
                          name: "wa_siap_diambil_penutup",
                          ref: waSiapDiambilPenutupRef,
                        })
                      }
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="poin">
          <Card>
            <CardHeader>
              <CardTitle>Skema Poin & Membership</CardTitle>
              <CardDescription>
                Pilih dan atur skema loyalitas untuk usaha Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* --- 1. PEMILIHAN SKEMA UTAMA --- */}
              <RadioGroup
                value={settings.skema_poin_aktif}
                onValueChange={handleSkemaChange}
                className="space-y-2"
              >
                <Label className="font-semibold">Pilih Skema Poin Utama</Label>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nonaktif" id="skema-nonaktif" />
                  <Label htmlFor="skema-nonaktif">Tidak Aktif</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nominal" id="skema-nominal" />
                  <Label htmlFor="skema-nominal">
                    Berdasarkan Nominal Transaksi
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="berat" id="skema-berat" />
                  <Label htmlFor="skema-berat">Berdasarkan Berat Cucian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="kunjungan" id="skema-kunjungan" />
                  <Label htmlFor="skema-kunjungan">Berdasarkan Kunjungan</Label>
                </div>
              </RadioGroup>

              <Separator />

              {/* Tampilkan pengaturan lain HANYA JIKA sistem poin aktif */}
              {isPoinSystemActive && (
                <div className="space-y-6">
                  {/* --- 2. PENGATURAN MEMBERSHIP --- */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="wajib_membership_berbayar"
                        checked={settings.wajib_membership_berbayar}
                        onCheckedChange={(checked) =>
                          handleCheckedChange(
                            "wajib_membership_berbayar",
                            checked
                          )
                        }
                      />
                      <Label htmlFor="wajib_membership_berbayar">
                        Wajibkan Membership Berbayar untuk Mendapat Poin
                      </Label>
                    </div>
                    {settings.wajib_membership_berbayar && (
                      <div>
                        <Label htmlFor="biaya_membership">
                          Biaya Membership (Rp)
                        </Label>
                        <Input
                          id="biaya_membership"
                          name="biaya_membership"
                          type="number"
                          value={settings.biaya_membership || 0}
                          onChange={handleChange}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Biaya sekali bayar untuk mengaktifkan keanggotaan.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* --- 3. PENGATURAN SPESIFIK SKEMA --- */}
                  <div className="p-4 border bg-muted/50 rounded-lg space-y-4">
                    {settings.skema_poin_aktif === "nominal" && (
                      <div>
                        <Label>Setiap Belanja (Rp)</Label>
                        <Input
                          name="rupiah_per_poin"
                          type="number"
                          value={settings.rupiah_per_poin || 0}
                          onChange={handleChange}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Jumlah belanja untuk mendapatkan 1 poin.
                        </p>
                      </div>
                    )}
                    {settings.skema_poin_aktif === "berat" && (
                      <div className="space-y-4">
                        <Label>Setiap Berat (Kg)</Label>
                        <Input
                          name="berat_per_poin"
                          type="number"
                          value={settings.berat_per_poin || 0}
                          onChange={handleChange}
                        />
                        <Label>Mendapatkan Poin</Label>
                        <Input
                          name="poin_per_kg"
                          type="number"
                          value={settings.poin_per_kg || 0}
                          onChange={handleChange}
                        />
                      </div>
                    )}
                    {settings.skema_poin_aktif === "kunjungan" && (
                      <div>
                        <Label>Poin per Transaksi</Label>
                        <Input
                          name="poin_per_kunjungan"
                          type="number"
                          value={settings.poin_per_kunjungan || 0}
                          onChange={handleChange}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Poin yang didapat setiap pelanggan bertransaksi.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* --- 4. ATURAN POIN UNIVERSAL --- */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Aturan Poin Universal</h4>
                    <div>
                      <Label>Nilai 1 Poin (Potongan Rp)</Label>
                      <Input
                        name="rupiah_per_poin_redeem"
                        type="number"
                        value={settings.rupiah_per_poin_redeem || 0}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <Label>Minimal Penukaran Poin</Label>
                      <Input
                        name="minimal_penukaran_poin"
                        type="number"
                        value={settings.minimal_penukaran_poin || 0}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <Label>Masa Berlaku Poin (Hari)</Label>
                      <Input
                        name="masa_berlaku_poin_hari"
                        type="number"
                        value={settings.masa_berlaku_poin_hari || 0}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* --- 5. BONUS TAMBAHAN --- */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">
                      Bonus Tambahan
                    </h3>
                    <div className="p-4 border bg-muted/50 rounded-lg space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="apakah_bonus_merchandise_aktif"
                          checked={settings.apakah_bonus_merchandise_aktif}
                          onCheckedChange={(checked) =>
                            handleCheckedChange(
                              "apakah_bonus_merchandise_aktif",
                              checked
                            )
                          }
                        />
                        <Label htmlFor="apakah_bonus_merchandise_aktif">
                          Aktifkan Bonus Merchandise
                        </Label>
                      </div>
                      {settings.apakah_bonus_merchandise_aktif && (
                        <div className="space-y-4 pl-6">
                          <div>
                            <Label>Nama Merchandise</Label>
                            <Input
                              name="nama_merchandise"
                              value={settings.nama_merchandise || ""}
                              onChange={handleChange}
                              placeholder="Contoh: Totebag, Payung"
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              Nama ini akan ditampilkan di halaman kasir.
                            </p>
                          </div>
                          <div>
                            <Label>Jumlah Poin Bonus</Label>
                            <Input
                              name="bonus_poin_merchandise"
                              type="number"
                              value={settings.bonus_poin_merchandise || 0}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operasional">
          <Card>
            <CardHeader>
              <CardTitle>Aturan Operasional</CardTitle>
              <CardDescription>
                Atur detail operasional seperti pajak dan format invoice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pajak_persen">Pajak Penjualan (%)</Label>
                <Input
                  id="pajak_persen"
                  name="pajak_persen"
                  type="number"
                  step="0.1"
                  value={settings.pajak_persen || 0}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="invoice_prefix">Awalan Kode Invoice</Label>
                <Input
                  id="invoice_prefix"
                  name="invoice_prefix"
                  value={settings.invoice_prefix || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">
                  Pengaturan Layanan Antar-Jemput
                </h3>
                <div className="p-4 border bg-muted/50 rounded-lg space-y-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="layanan_antar_jemput_aktif"
                      name="layanan_antar_jemput_aktif"
                      checked={settings.layanan_antar_jemput_aktif}
                      onCheckedChange={(checked) =>
                        handleCheckedChange(
                          "layanan_antar_jemput_aktif",
                          checked
                        )
                      }
                    />
                    <Label htmlFor="layanan_antar_jemput_aktif">
                      Aktifkan Layanan Antar-Jemput
                    </Label>
                  </div>

                  {/* Pengaturan Harga Jemput */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="batas_jarak_gratis_jemput"
                      className={
                        !settings.layanan_antar_jemput_aktif
                          ? "text-muted-foreground"
                          : ""
                      }
                    >
                      Batas Jarak Gratis Jemput (Km)
                    </Label>
                    <Input
                      id="batas_jarak_gratis_jemput"
                      name="batas_jarak_gratis_jemput"
                      type="number"
                      step="0.1"
                      value={settings.batas_jarak_gratis_jemput || 0}
                      onChange={handleChange}
                      disabled={!settings.layanan_antar_jemput_aktif}
                    />
                    <p className="text-xs text-muted-foreground">
                      Isi 0 jika tidak ada gratis ongkir jemput.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="biaya_jemput_jarak"
                      className={
                        !settings.layanan_antar_jemput_aktif
                          ? "text-muted-foreground"
                          : ""
                      }
                    >
                      Biaya Jemput (jika &gt; batas gratis)
                    </Label>
                    <Input
                      id="biaya_jemput_jarak"
                      name="biaya_jemput_jarak"
                      type="number"
                      value={settings.biaya_jemput_jarak || 0}
                      onChange={handleChange}
                      disabled={!settings.layanan_antar_jemput_aktif}
                    />
                  </div>

                  <Separator />

                  {/* Pengaturan Harga Antar */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="batas_jarak_gratis_antar"
                      className={
                        !settings.layanan_antar_jemput_aktif
                          ? "text-muted-foreground"
                          : ""
                      }
                    >
                      Batas Jarak Gratis Antar (Km)
                    </Label>
                    <Input
                      id="batas_jarak_gratis_antar"
                      name="batas_jarak_gratis_antar"
                      type="number"
                      step="0.1"
                      value={settings.batas_jarak_gratis_antar || 0}
                      onChange={handleChange}
                      disabled={!settings.layanan_antar_jemput_aktif}
                    />
                    <p className="text-xs text-muted-foreground">
                      Isi 0 jika tidak ada gratis ongkir antar.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="biaya_antar_jarak"
                      className={
                        !settings.layanan_antar_jemput_aktif
                          ? "text-muted-foreground"
                          : ""
                      }
                    >
                      Biaya Antar (jika &gt; batas gratis)
                    </Label>
                    <Input
                      id="biaya_antar_jarak"
                      name="biaya_antar_jarak"
                      type="number"
                      value={settings.biaya_antar_jarak || 0}
                      onChange={handleChange}
                      disabled={!settings.layanan_antar_jemput_aktif}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <AlertDialog
        open={confirmationModal.isOpen}
        onOpenChange={(isOpen) =>
          setConfirmationModal({ ...confirmationModal, isOpen })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Anda Yakin Ingin Mengubah Skema Poin?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Mengubah skema akan mengubah cara pelanggan mendapatkan poin.
              Pastikan Anda sudah memahami konsekuensinya. Pengaturan lama Anda
              untuk skema sebelumnya akan tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setConfirmationModal({ isOpen: false, nextScheme: null })
              }
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSkemaChange}>
              Ya, Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

export default PengaturanUsahaPage;
