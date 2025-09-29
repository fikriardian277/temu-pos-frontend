// src/pages/PengaturanUsahaPage.jsx

import React, { useState, useEffect } from "react";
import api from "@/api/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Impor komponen
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function PengaturanUsahaPage() {
  const { authState, login } = useAuth();
  const [settings, setSettings] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    nextScheme: null, // Untuk menyimpan pilihan skema berikutnya
  });

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
