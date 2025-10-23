// src/pages/LayananManagementPage.jsx (VERSI ANTI-BOCOR & LENGKAP)

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Edit,
  MoreVertical,
  Loader2,
  Download,
} from "lucide-react";
import { usePageVisibility } from "@/lib/usePageVisibility.js";

// Impor semua komponen dari shadcn/ui
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/Alert-dialog.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown-menu.jsx";

// Komponen Aksi yang bisa dipakai ulang
const ActionMenu = ({ onEdit, onDelete }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={onEdit}>
        <Edit className="mr-2 h-4 w-4" />
        <span>Edit</span>
      </DropdownMenuItem>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Hapus</span>
          </DropdownMenuItem>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Aksi ini akan menghapus item ini dan semua data di bawahnya secara
              permanen. Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>
              Ya, Lanjutkan Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenuContent>
  </DropdownMenu>
);

function LayananManagementPage() {
  const { authState } = useAuth();
  const [categories, setCategories] = useState([]); // <-- Ganti nama state biar jelas
  const [loading, setLoading] = useState(true);
  const [loadingCSV, setLoadingCSV] = useState(false);
  const [modalState, setModalState] = useState({
    type: null,
    data: null,
    isOpen: false,
  });
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!authState.business_id) return;

    try {
      setLoading(true);
      // PERUBAHAN #1: Filter query berdasarkan business_id
      const { data, error } = await supabase
        .from("categories")
        .select(`*, services (*, packages (*))`)
        .eq("business_id", authState.business_id)
        .order("created_at", { ascending: true })
        .order("created_at", { foreignTable: "services", ascending: true })
        .order("created_at", {
          foreignTable: "services.packages",
          ascending: true,
        });

      if (error) throw error;

      // PERUBAHAN #2: Hapus "penerjemah". Langsung gunakan data apa adanya.
      setCategories(data);
    } catch (err) {
      toast.error("Gagal mengambil data layanan.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [authState.business_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pasang sensor anti-macet
  usePageVisibility(fetchData);

  const handleDownloadCSV = async () => {
    if (!authState.isReady || !authState.business_id || loadingCSV) return;

    setLoadingCSV(true);
    try {
      // Panggil RPC baru
      const { data, error } = await supabase.rpc("get_services_for_csv", {
        p_business_id: authState.business_id,
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.info("Tidak ada data layanan/paket untuk di-download.");
        return; // Keluar jika data kosong
      }

      // 1. Definisikan Header CSV (sesuai urutan RETURNS TABLE di SQL)
      const headers = [
        "Kategori",
        "Layanan",
        "Nama Paket",
        "Harga (Rp)",
        "Satuan",
        "Estimasi Waktu",
        "Estimasi Jam",
        "Minimal Order",
      ];

      // 2. Escape function (sama seperti sebelumnya)
      const escapeCsvValue = (value) => {
        if (value === null || typeof value === "undefined") return "";
        const stringValue = String(value);
        if (
          stringValue.includes(",") ||
          stringValue.includes('"') ||
          stringValue.includes("\n")
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      // 3. Ubah Array of Objects jadi Array of Arrays
      const csvData = data.map((row) => [
        row.nama_kategori,
        row.nama_layanan,
        row.nama_paket,
        row.harga,
        row.satuan,
        row.estimasi_waktu,
        row.estimasi_jam,
        row.minimal_order,
      ]);

      // 4. Gabungkan Header dan Data jadi string CSV (dengan BOM dan sep=,)
      const headerString = headers.map(escapeCsvValue).join(",");
      const dataString = csvData
        .map((row) => row.map(escapeCsvValue).join(","))
        .join("\n");
      const csvContent =
        "\ufeff" + "sep=,\n" + headerString + "\n" + dataString;

      // 5. Buat Blob dan Link Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      // Nama file: Layanan_YYYY-MM-DD.csv
      const today = new Date().toISOString().split("T")[0];
      const fileName = `Layanan_${today}.csv`;
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Gagal download CSV Layanan:", error);
      toast.error(error.message || "Gagal mengunduh data layanan.");
    } finally {
      setLoadingCSV(false);
    }
  };

  const handleOpenModal = (type, data = {}) => {
    setModalState({ type, data, isOpen: true });
    setFormData(data);
  };
  const handleCloseModal = () =>
    setModalState({ type: null, data: null, isOpen: false });
  const handleFormChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { type, data: modalData } = modalState;
    setIsSubmitting(true);

    try {
      let error;
      const business_id = authState.business_id; // Ambil business_id

      // PERUBAHAN #3: Selalu sertakan business_id saat INSERT
      if (type === "new_kategori") {
        ({ error } = await supabase
          .from("categories")
          .insert({ name: formData.name, business_id }));
      } else if (type === "edit_kategori") {
        ({ error } = await supabase
          .from("categories")
          .update({ name: formData.name })
          .eq("id", modalData.id)
          .eq("business_id", business_id));
      } else if (type === "new_layanan") {
        ({ error } = await supabase.from("services").insert({
          name: formData.name,
          category_id: modalData.id,
          business_id,
        }));
      } else if (type === "edit_layanan") {
        ({ error } = await supabase
          .from("services")
          .update({ name: formData.name })
          .eq("id", modalData.id)
          .eq("business_id", business_id));
      } else if (type === "new_paket") {
        ({ error } = await supabase.from("packages").insert({
          name: formData.name,
          price: formData.price,
          unit: formData.unit,
          time_estimation: formData.time_estimation,
          min_order: formData.min_order,
          service_id: modalData.id,
          business_id,
          estimation_in_hours: formData.estimation_in_hours,
        }));
      } else if (type === "edit_paket") {
        ({ error } = await supabase
          .from("packages")
          .update({
            name: formData.name,
            price: formData.price,
            unit: formData.unit,
            time_estimation: formData.time_estimation,
            min_order: formData.min_order,
            estimation_in_hours: formData.estimation_in_hours,
          })
          .eq("id", modalData.id)
          .eq("business_id", business_id));
      }

      if (error) throw error;
      toast.success("Data berhasil disimpan!");
      handleCloseModal();
      fetchData();
    } catch (err) {
      toast.error(`Gagal memproses data: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (type, id) => {
    try {
      let error;
      const business_id = authState.business_id; // Ambil business_id

      // PERUBAHAN #4: Selalu filter dengan business_id saat DELETE
      if (type === "kategori") {
        ({ error } = await supabase
          .from("categories")
          .delete()
          .eq("id", id)
          .eq("business_id", business_id));
      } else if (type === "layanan") {
        ({ error } = await supabase
          .from("services")
          .delete()
          .eq("id", id)
          .eq("business_id", business_id));
      } else if (type === "paket") {
        ({ error } = await supabase
          .from("packages")
          .delete()
          .eq("id", id)
          .eq("business_id", business_id));
      }

      if (error) throw error;
      toast.success(`Data ${type} berhasil dihapus.`);
      fetchData();
    } catch (err) {
      toast.error(`Gagal menghapus ${type}: ${err.message}`);
    }
  };

  if (loading) return <p className="text-center">Memuat data...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Layanan</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadCSV} // <-- Fungsi yg akan dibuat
            disabled={loading || loadingCSV || categories.length === 0}
            variant="outline" // Biar beda dari tombol utama
          >
            {loadingCSV ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download CSV
          </Button>
          <Button onClick={() => handleOpenModal("new_kategori")}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {categories?.map((kategori) => (
          <Card key={kategori.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl text-primary">
                {kategori.name} {/* BENERIN: Menggunakan nama kolom asli */}
              </CardTitle>
              <div className="flex items-center">
                <ActionMenu
                  onEdit={() => handleOpenModal("edit_kategori", kategori)}
                  onDelete={() => handleDelete("kategori", kategori.id)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenModal("new_layanan", kategori)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Layanan
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {kategori.services?.map(
                (
                  layanan // BENERIN: Menggunakan nama relasi asli
                ) => (
                  <div
                    key={layanan.id}
                    className="bg-background p-4 rounded-md border"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold">
                        {layanan.name}{" "}
                        {/* BENERIN: Menggunakan nama kolom asli */}
                      </h3>
                      <div className="flex items-center">
                        <ActionMenu
                          onEdit={() =>
                            handleOpenModal("edit_layanan", layanan)
                          }
                          onDelete={() => handleDelete("layanan", layanan.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal("new_paket", layanan)}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Paket
                        </Button>
                      </div>
                    </div>
                    <div className="pl-4 mt-3 space-y-3 border-l-2 border-border">
                      {layanan.packages?.map(
                        (
                          paket // BENERIN: Menggunakan nama relasi asli
                        ) => (
                          <div
                            key={paket.id}
                            className="flex justify-between items-center pl-2"
                          >
                            <div>
                              <p>
                                {paket.name} ({paket.time_estimation}){" "}
                                {/* BENERIN */}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Rp {paket.price.toLocaleString("id-ID")} /{" "}
                                {paket.unit} {/* BENERIN */}
                              </p>
                            </div>
                            <ActionMenu
                              onEdit={() =>
                                handleOpenModal("edit_paket", paket)
                              }
                              onDelete={() => handleDelete("paket", paket.id)}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={modalState.isOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalState.type?.startsWith("edit_")
                ? `Edit ${modalState.type.split("_")[1]}`
                : `Tambah ${modalState.type?.split("_")[1]} Baru`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {(modalState.type === "new_kategori" ||
              modalState.type === "edit_kategori") && (
              <div>
                <Label htmlFor="name">Nama Kategori</Label>
                <Input
                  id="name"
                  name="name" // BENERIN
                  value={formData.name || ""} // BENERIN
                  onChange={handleFormChange}
                  required
                  autoFocus
                />
              </div>
            )}
            {(modalState.type === "new_layanan" ||
              modalState.type === "edit_layanan") && (
              <div>
                <Label htmlFor="name">Nama Layanan</Label>
                <Input
                  id="name"
                  name="name" // BENERIN
                  value={formData.name || ""} // BENERIN
                  onChange={handleFormChange}
                  required
                  autoFocus
                />
              </div>
            )}
            {(modalState.type === "new_paket" ||
              modalState.type === "edit_paket") && (
              <>
                <div>
                  <Label htmlFor="name">Nama Paket</Label>
                  <Input
                    id="name"
                    name="name" // BENERIN
                    value={formData.name || ""} // BENERIN
                    onChange={handleFormChange}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="price">Harga</Label>
                  <Input
                    id="price"
                    name="price" // BENERIN
                    type="number"
                    value={formData.price || ""} // BENERIN
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time_estimation">Estimasi Waktu</Label>
                  <Input
                    id="time_estimation"
                    name="time_estimation" // BENERIN
                    value={formData.time_estimation || ""} // BENERIN
                    onChange={handleFormChange}
                    placeholder="Contoh: 2-3 Hari"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="estimation_in_hours">
                    Estimasi Waktu (Total Jam)
                  </Label>
                  <Input
                    id="estimation_in_hours"
                    name="estimation_in_hours"
                    type="number"
                    value={formData.estimation_in_hours || ""}
                    onChange={handleFormChange}
                    placeholder="Contoh: 24 (untuk 1 hari), 4 (untuk 4 jam)"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Wajib diisi angka (dalam jam) untuk perhitungan.
                  </p>
                </div>

                <div>
                  <Label htmlFor="unit">Satuan</Label>
                  <Input
                    id="unit"
                    name="unit" // BENERIN
                    value={formData.unit || ""} // BENERIN
                    onChange={handleFormChange}
                    placeholder="Contoh: kg/pcs"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="min_order">Minimal Order (Kg/Pcs)</Label>
                  <Input
                    id="min_order"
                    name="min_order" // BENERIN
                    type="number"
                    value={formData.min_order || ""} // BENERIN
                    onChange={handleFormChange}
                    placeholder="0"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Isi 0 jika tidak ada minimal order.
                  </p>
                </div>
              </>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LayananManagementPage;
