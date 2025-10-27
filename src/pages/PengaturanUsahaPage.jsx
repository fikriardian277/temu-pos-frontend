import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { usePageVisibility } from "@/lib/usePageVisibility.js";

// Impor komponen-komponen UI
import { Button } from "@/components/ui/Button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card.jsx";
import { Input } from "@/components/ui/Input.jsx";
import { Label } from "@/components/ui/Label.jsx";
import { Checkbox } from "@/components/ui/Checkbox.jsx";
import { Textarea } from "@/components/ui/Textarea.jsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/Tabs.jsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/Radio-group.jsx";
import { Separator } from "@/components/ui/Separator.jsx";
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
} from "@/components/ui/Alert-dialog.jsx";
import { Loader2 } from "lucide-react";

function PengaturanUsahaPage() {
  const { authState, refetchAuthData } = useAuth();
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
    nextScheme: null,
  });

  // ==========================================================
  // SEMUA FUNGSI HELPER & REF ASLI-MU (AMAN, TIDAK HILANG)
  // ==========================================================
  const waHeaderRef = useRef(null);
  const waStrukPembukaRef = useRef(null);
  const waStrukPenutupRef = useRef(null);
  const waSiapDiambilPembukaRef = useRef(null);
  const waSiapDiambilPenutupRef = useRef(null);

  const handleInsertVariable = (variable) => {
    if (!activeTextarea.name || !activeTextarea.ref?.current) {
      toast.warning("Klik dulu di dalam kotak pesan sebelum memilih variabel.");
      return;
    }
    const textarea = activeTextarea.ref.current;
    const currentText = textarea.value || "";
    const cursorPos = textarea.selectionStart;
    const newText =
      currentText.substring(0, cursorPos) +
      variable +
      currentText.substring(cursorPos);

    setSettings((prev) => ({ ...prev, [activeTextarea.name]: newText }));

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

  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    // Jika inputnya kosong, simpan sebagai NULL, bukan string kosong!
    // Jika ada isinya, ubah jadi angka desimal (float)
    const numericValue = value === "" ? null : parseFloat(value);
    setSettings((prev) => ({ ...prev, [name]: numericValue }));
  };

  const handleCheckedChange = (name, checked) => {
    setSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSkemaChange = (value) => {
    if (value !== settings.points_scheme) {
      setConfirmationModal({ isOpen: true, nextScheme: value });
    }
  };

  const handleConfirmSkemaChange = () => {
    if (confirmationModal.nextScheme) {
      setSettings((prev) => ({
        ...prev,
        points_scheme: confirmationModal.nextScheme,
      }));
    }
    setConfirmationModal({ isOpen: false, nextScheme: null });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleUseDefaultTemplate = (type) => {
    // Sesuaikan NAMA KOLOM dengan "Kamus Final" database
    if (type === "struk") {
      setSettings((prev) => ({
        ...prev,
        wa_template_header: "*Struk Digital Superclean Laundry*",
        wa_template_receipt_opening:
          "Halo Kak {nama_pelanggan}! \nTerima kasih telah laundry di tempat kami. Berikut rincian transaksinya:",
        wa_template_receipt_closing:
          "Mohon simpan struk digital ini sebagai bukti transaksi.\nDitunggu kedatangannya kembali ya! ",
      }));
      toast.info("Template struk default telah dimuat.");
    } else if (type === "siap_diambil") {
      setSettings((prev) => ({
        ...prev,
        wa_template_ready_opening:
          "Halo Kak {nama_pelanggan}! \nKabar gembira! Cucian Anda dengan invoice *{kode_invoice}* sudah selesai diproses, bersih, wangi, dan siap untuk diambil.",
        wa_template_ready_closing:
          "Kami tunggu kedatangannya di outlet kami ya.\nTerima kasih!",
      }));
      toast.info("Template pesan 'Siap Diambil' default telah dimuat.");
    }
  };
  // ==========================================================
  // AKHIR DARI FUNGSI LAMA
  // ==========================================================

  const fetchSettings = useCallback(async () => {
    if (!authState.business_id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("business_id", authState.business_id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        if (data.logo_url) setLogoPreview(data.logo_url);
      } else {
        setSettings({
          business_id: authState.business_id,
          owner_id: authState.user.id,
        });
        toast.info(
          "Sepertinya ini pertama kali Anda membuka halaman pengaturan. Silakan isi dan simpan data usaha Anda."
        );
      }
    } catch (err) {
      toast.error("Gagal memuat pengaturan.");
    } finally {
      setLoading(false);
    }
  }, [authState.business_id, authState.user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // usePageVisibility(fetchSettings);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalSettings = { ...settings };

      if (logoFile) {
        console.log("CCTV PENGIRIMAN...", logoFile);
        const filePath = `public/${authState.business_id}-${Date.now()}-${
          logoFile.name
        }`;

        // VVV JURUS PAMUNGKAS: "KUPAS APELNYA" VVV
        // Kita buat Blob baru dari file yang ada, ini akan "membersihkan" semua metadata aneh.
        const cleanFile = new Blob([logoFile], { type: logoFile.type });
        // ^^^ JURUS PAMUNGKAS ^^^

        const { error: uploadError } = await supabase.storage
          .from("business_assets")
          .upload(filePath, cleanFile, { upsert: true }); // <-- MENGIRIM "JUS APEL" BERSIH

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("business_assets")
          .getPublicUrl(filePath);

        finalSettings.logo_url = publicUrlData.publicUrl;
      }

      delete finalSettings.created_at;
      console.log("DEBUG: Mengirim data settings:", finalSettings);
      const { error: saveError } = await supabase
        .from("settings")
        .upsert(finalSettings, { onConflict: "business_id" });

      if (saveError) throw saveError;

      toast.success("Pengaturan berhasil disimpan!");
      await new Promise((resolve) => setTimeout(resolve, 500));

      await refetchAuthData();
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-center p-10">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    );
  if (!settings)
    return (
      <p className="text-center">
        Data pengaturan tidak ditemukan. Coba refresh halaman.
      </p>
    );
  if (authState.role !== "owner")
    return (
      <p className="text-center">
        Hanya Owner yang dapat mengakses halaman ini.
      </p>
    );

  const isPoinSystemActive = settings.points_scheme !== "nonaktif";

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
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Semua Perubahan"
          )}
        </Button>
      </div>

      <Tabs defaultValue="profil" className="w-full">
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
              {/* --- BAGIAN PROFIL USAHA --- */}
              <div>
                <Label htmlFor="business_name">Nama Usaha</Label>
                <Input
                  id="business_name"
                  name="business_name" // BENERIN
                  value={settings.business_name || ""} // BENERIN
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="business_address">Alamat Usaha</Label>
                <Textarea
                  id="business_address"
                  name="business_address" // BENERIN
                  value={settings.business_address || ""} // BENERIN
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="business_phone">Nomor Telepon</Label>
                <Input
                  id="business_phone"
                  name="business_phone" // BENERIN
                  value={settings.business_phone || ""} // BENERIN
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

              {/* --- BAGIAN PENGATURAN STRUK --- */}
              <div className="pt-4 space-y-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show_logo_on_receipt" // BENERIN
                    name="show_logo_on_receipt" // BENERIN
                    checked={settings.show_logo_on_receipt} // BENERIN
                    onCheckedChange={
                      (checked) =>
                        handleCheckedChange("show_logo_on_receipt", checked) // BENERIN
                    }
                  />
                  <Label htmlFor="show_logo_on_receipt">
                    Tampilkan Logo di Struk
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show_header_on_receipt" // BENERIN
                    name="show_header_on_receipt" // BENERIN
                    checked={settings.show_header_on_receipt} // BENERIN
                    onCheckedChange={
                      (checked) =>
                        handleCheckedChange("show_header_on_receipt", checked) // BENERIN
                    }
                  />
                  <Label htmlFor="show_header_on_receipt">
                    Tampilkan Info Usaha (Header) di Struk
                  </Label>
                </div>
              </div>
              <div>
                <Label htmlFor="receipt_footer_text">Teks Footer Struk</Label>
                <Input
                  id="receipt_footer_text" // BENERIN
                  name="receipt_footer_text" // BENERIN
                  value={settings.receipt_footer_text || ""} // BENERIN
                  onChange={handleChange}
                />
              </div>

              {/* --- BAGIAN TEMPLATE WHATSAPP --- */}
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
                    <Label htmlFor="wa_template_header">Header Pesan</Label>
                    <Input
                      ref={waHeaderRef}
                      id="wa_template_header" // BENERIN
                      name="wa_template_header" // BENERIN
                      value={settings.wa_template_header || ""} // BENERIN
                      onChange={handleChange}
                      onFocus={
                        () =>
                          setActiveTextarea({
                            name: "wa_template_header",
                            ref: waHeaderRef,
                          }) // BENERIN
                      }
                      placeholder="Contoh: *Struk Digital Laundry Anda*"
                    />
                  </div>
                  <div>
                    <Label htmlFor="wa_template_receipt_opening">
                      Pesan Pembuka
                    </Label>
                    <Textarea
                      ref={waStrukPembukaRef}
                      id="wa_template_receipt_opening" // BENERIN
                      name="wa_template_receipt_opening" // BENERIN
                      value={settings.wa_template_receipt_opening || ""} // BENERIN
                      onChange={handleChange}
                      onFocus={
                        () =>
                          setActiveTextarea({
                            name: "wa_template_receipt_opening",
                            ref: waStrukPembukaRef,
                          }) // BENERIN
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
                    <Label htmlFor="wa_template_receipt_closing">
                      Pesan Penutup
                    </Label>
                    <Textarea
                      ref={waStrukPenutupRef}
                      id="wa_template_receipt_closing" // BENERIN
                      name="wa_template_receipt_closing" // BENERIN
                      value={settings.wa_template_receipt_closing || ""} // BENERIN
                      onChange={handleChange}
                      onFocus={
                        () =>
                          setActiveTextarea({
                            name: "wa_template_receipt_closing",
                            ref: waStrukPenutupRef,
                          }) // BENERIN
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
                    <Label htmlFor="wa_template_ready_opening">
                      Pesan Pembuka
                    </Label>
                    <Textarea
                      ref={waSiapDiambilPembukaRef}
                      id="wa_template_ready_opening" // BENERIN
                      name="wa_template_ready_opening" // BENERIN
                      value={settings.wa_template_ready_opening || ""} // BENERIN
                      onChange={handleChange}
                      onFocus={
                        () =>
                          setActiveTextarea({
                            name: "wa_template_ready_opening",
                            ref: waSiapDiambilPembukaRef,
                          }) // BENERIN
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
                    <Label htmlFor="wa_template_ready_closing">
                      Pesan Penutup
                    </Label>
                    <Textarea
                      ref={waSiapDiambilPenutupRef}
                      id="wa_template_ready_closing" // BENERIN
                      name="wa_template_ready_closing" // BENERIN
                      value={settings.wa_template_ready_closing || ""} // BENERIN
                      onChange={handleChange}
                      onFocus={
                        () =>
                          setActiveTextarea({
                            name: "wa_template_ready_closing",
                            ref: waSiapDiambilPenutupRef,
                          }) // BENERIN
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
                value={settings.points_scheme}
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

              {settings.points_scheme !== "nonaktif" && (
                <div className="space-y-6">
                  {/* --- 2. PENGATURAN MEMBERSHIP --- */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="require_paid_membership"
                        checked={settings.require_paid_membership}
                        onCheckedChange={(checked) =>
                          handleCheckedChange(
                            "require_paid_membership",
                            checked
                          )
                        }
                      />
                      <Label htmlFor="require_paid_membership">
                        Wajibkan Membership Berbayar untuk Mendapat Poin
                      </Label>
                    </div>
                    {settings.require_paid_membership && (
                      <div>
                        <Label htmlFor="membership_fee">
                          Biaya Membership (Rp)
                        </Label>
                        <Input
                          id="membership_fee"
                          name="membership_fee"
                          type="number"
                          value={settings.membership_fee || ""}
                          onChange={handleNumericChange}
                        />
                      </div>
                    )}
                  </div>

                  {/* --- 3. PENGATURAN SPESIFIK SKEMA --- */}
                  <div className="p-4 border bg-muted/50 rounded-lg space-y-4">
                    {settings.points_scheme === "nominal" && (
                      <div>
                        <Label>Setiap Belanja (Rp)</Label>
                        <Input
                          name="rupiah_per_point_earn"
                          type="number"
                          value={settings.rupiah_per_point_earn || ""}
                          onChange={handleNumericChange}
                        />
                      </div>
                    )}
                    {settings.points_scheme === "berat" && (
                      <div className="space-y-4">
                        <Label>Setiap Berat (Kg)</Label>
                        <Input
                          name="berat_per_poin"
                          type="number"
                          value={settings.berat_per_poin || ""}
                          onChange={handleNumericChange}
                        />
                        <Label>Mendapatkan Poin</Label>
                        <Input
                          name="poin_per_kg"
                          type="number"
                          value={settings.poin_per_kg || ""}
                          onChange={handleNumericChange}
                        />
                      </div>
                    )}
                    {settings.points_scheme === "kunjungan" && (
                      <div>
                        <Label>Poin per Transaksi</Label>
                        <Input
                          name="poin_per_kunjungan"
                          type="number"
                          value={settings.poin_per_kunjungan || ""}
                          onChange={handleNumericChange}
                        />
                      </div>
                    )}
                  </div>

                  {/* --- 4. ATURAN POIN UNIVERSAL --- */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Aturan Poin Universal</h4>
                    <div>
                      <Label>Nilai 1 Poin (Potongan Rp)</Label>
                      <Input
                        name="rupiah_per_point_redeem"
                        type="number"
                        value={settings.rupiah_per_point_redeem || ""}
                        onChange={handleNumericChange}
                      />
                    </div>
                    <div>
                      <Label>Minimal Penukaran Poin</Label>
                      <Input
                        name="min_points_to_redeem"
                        type="number"
                        value={settings.min_points_to_redeem || ""}
                        onChange={handleNumericChange}
                      />
                    </div>
                    <div>
                      <Label>Masa Berlaku Poin (Hari)</Label>
                      <Input
                        name="points_expiry_days"
                        type="number"
                        value={settings.points_expiry_days || ""}
                        onChange={handleNumericChange}
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
                          id="is_merch_bonus_active"
                          checked={settings.is_merch_bonus_active}
                          onCheckedChange={(checked) =>
                            handleCheckedChange(
                              "is_merch_bonus_active",
                              checked
                            )
                          }
                        />
                        <Label htmlFor="is_merch_bonus_active">
                          Aktifkan Bonus Merchandise
                        </Label>
                      </div>
                      {settings.is_merch_bonus_active && (
                        <div className="space-y-4 pl-6">
                          <div>
                            <Label>Nama Merchandise</Label>
                            <Input
                              name="merch_bonus_name"
                              value={settings.merch_bonus_name || ""}
                              onChange={handleChange}
                              placeholder="Contoh: Totebag, Payung"
                            />
                          </div>
                          <div>
                            <Label>Jumlah Poin Bonus</Label>
                            <Input
                              name="bonus_poin_merchandise"
                              type="number"
                              value={settings.bonus_poin_merchandise || ""}
                              onChange={handleNumericChange}
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
                <Label htmlFor="tax_percentage">Pajak Penjualan (%)</Label>
                <Input
                  id="tax_percentage" // BENERIN
                  name="tax_percentage" // BENERIN
                  type="number"
                  step="0.1"
                  value={settings.tax_percentage || ""} // BENERIN
                  onChange={handleNumericChange}
                />
              </div>
              <div>
                <Label htmlFor="invoice_prefix">Awalan Kode Invoice</Label>
                <Input
                  id="invoice_prefix" // BENERIN
                  name="invoice_prefix" // BENERIN
                  value={settings.invoice_prefix || ""} // BENERIN
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
                      id="is_delivery_service_active" // BENERIN
                      name="is_delivery_service_active" // BENERIN
                      checked={settings.is_delivery_service_active} // BENERIN
                      onCheckedChange={
                        (checked) =>
                          handleCheckedChange(
                            "is_delivery_service_active",
                            checked
                          ) // BENERIN
                      }
                    />
                    <Label htmlFor="is_delivery_service_active">
                      Aktifkan Layanan Antar-Jemput
                    </Label>
                  </div>

                  {/* Pengaturan Harga Jemput */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="delivery_free_pickup_distance" // BENERIN
                      className={
                        !settings.is_delivery_service_active
                          ? "text-muted-foreground"
                          : ""
                      }
                    >
                      Batas Jarak Gratis Jemput (Km)
                    </Label>
                    <Input
                      id="delivery_free_pickup_distance" // BENERIN
                      name="delivery_free_pickup_distance" // BENERIN
                      type="number"
                      step="0.1"
                      value={settings.delivery_free_pickup_distance || ""} // BENERIN
                      onChange={handleNumericChange}
                      disabled={!settings.is_delivery_service_active}
                    />
                    <p className="text-xs text-muted-foreground">
                      Isi 0 jika tidak ada gratis ongkir jemput.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="delivery_pickup_fee" // BENERIN
                      className={
                        !settings.is_delivery_service_active
                          ? "text-muted-foreground"
                          : ""
                      }
                    >
                      Biaya Jemput (jika &gt; batas gratis)
                    </Label>
                    <Input
                      id="delivery_pickup_fee" // BENERIN
                      name="delivery_pickup_fee" // BENERIN
                      type="number"
                      value={settings.delivery_pickup_fee || ""} // BENERIN
                      onChange={handleNumericChange}
                      disabled={!settings.is_delivery_service_active}
                    />
                  </div>

                  <Separator />

                  {/* Pengaturan Harga Antar */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="delivery_free_dropoff_distance" // BENERIN
                      className={
                        !settings.is_delivery_service_active
                          ? "text-muted-foreground"
                          : ""
                      }
                    >
                      Batas Jarak Gratis Antar (Km)
                    </Label>
                    <Input
                      id="delivery_free_dropoff_distance" // BENERIN
                      name="delivery_free_dropoff_distance" // BENERIN
                      type="number"
                      step="0.1"
                      value={settings.delivery_free_dropoff_distance || ""} // BENERIN
                      onChange={handleNumericChange}
                      disabled={!settings.is_delivery_service_active}
                    />
                    <p className="text-xs text-muted-foreground">
                      Isi 0 jika tidak ada gratis ongkir antar.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="delivery_dropoff_fee" // BENERIN
                      className={
                        !settings.is_delivery_service_active
                          ? "text-muted-foreground"
                          : ""
                      }
                    >
                      Biaya Antar (jika &gt; batas gratis)
                    </Label>
                    <Input
                      id="delivery_dropoff_fee" // BENERIN
                      name="delivery_dropoff_fee" // BENERIN
                      type="number"
                      value={settings.delivery_dropoff_fee || ""} // BENERIN
                      onChange={handleNumericChange}
                      disabled={!settings.is_delivery_service_active}
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
