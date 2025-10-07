// src/pages/LayananManagementPage.jsx

import React, { useState, useEffect } from "react";
import api from "@/api/axiosInstance";
import { Plus, Trash2, Edit, MoreVertical } from "lucide-react";
import { toast } from "sonner";

// Impor semua komponen dari shadcn/ui
import { Button } from "@/components/ui/Button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
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
} from "@/components/ui/alert-dialog.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";

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
  const [kategoriData, setKategoriData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalState, setModalState] = useState({
    type: null,
    data: null,
    isOpen: false,
  });
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      if (!loading) setLoading(true);
      const response = await api.get("/layanan");
      setKategoriData(response.data);
    } catch (err) {
      setError("Gagal mengambil data layanan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (type, data = {}) => {
    setModalState({ type, data, isOpen: true });
    setFormData(data);
    setFormError("");
  };

  const handleCloseModal = () =>
    setModalState({ type: null, data: null, isOpen: false });
  const handleFormChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const { type, data } = modalState;
    try {
      if (type === "new_kategori")
        await api.post("/kategori", { nama_kategori: formData.nama_kategori });
      else if (type === "edit_kategori")
        await api.put(`/kategori/${data.id}`, {
          nama_kategori: formData.nama_kategori,
        });
      else if (type === "new_layanan")
        await api.post("/layanan", { ...formData, id_kategori: data.id });
      else if (type === "edit_layanan")
        await api.put(`/layanan/${data.id}`, formData);
      else if (type === "new_paket")
        await api.post("/paket", { ...formData, id_layanan: data.id });
      else if (type === "edit_paket")
        await api.put(`/paket/${data.id}`, formData);
      toast.success("Data berhasil disimpan!");
      handleCloseModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || `Gagal memproses data.`);
    }
  };

  const handleDelete = async (type, id) => {
    try {
      if (type === "kategori") await api.delete(`/kategori/${id}`);
      else if (type === "layanan") await api.delete(`/layanan/${id}`);
      else if (type === "paket") await api.delete(`/paket/${id}`);
      toast.success(`Data ${type} berhasil dihapus.`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || `Gagal menghapus ${type}.`);
    }
  };

  if (loading) return <p className="text-center">Memuat data...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Layanan</h1>
        <Button onClick={() => handleOpenModal("new_kategori")}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
        </Button>
      </div>

      <div className="space-y-6">
        {kategoriData.map((kategori) => (
          <Card key={kategori.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl text-primary">
                {kategori.nama_kategori}
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
              {kategori.Layanans.map((layanan) => (
                <div
                  key={layanan.id}
                  className="bg-background p-4 rounded-md border"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">
                      {layanan.nama_layanan}
                    </h3>
                    <div className="flex items-center">
                      <ActionMenu
                        onEdit={() => handleOpenModal("edit_layanan", layanan)}
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
                    {layanan.Pakets.map((paket) => (
                      <div
                        key={paket.id}
                        className="flex justify-between items-center pl-2"
                      >
                        <div>
                          <p>
                            {paket.nama_paket} ({paket.estimasi_waktu})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Rp {paket.harga.toLocaleString("id-ID")} /{" "}
                            {paket.satuan}
                          </p>
                        </div>
                        <ActionMenu
                          onEdit={() => handleOpenModal("edit_paket", paket)}
                          onDelete={() => handleDelete("paket", paket.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
            {formError && (
              <p className="text-destructive text-sm text-center">
                {formError}
              </p>
            )}
            {(modalState.type === "new_kategori" ||
              modalState.type === "edit_kategori") && (
              <div>
                <Label htmlFor="nama_kategori">Nama Kategori</Label>
                <Input
                  id="nama_kategori"
                  name="nama_kategori"
                  value={formData.nama_kategori || ""}
                  onChange={handleFormChange}
                  required
                  autoFocus
                />
              </div>
            )}
            {(modalState.type === "new_layanan" ||
              modalState.type === "edit_layanan") && (
              <>
                <Label htmlFor="nama_layanan">Nama Layanan</Label>
                <Input
                  id="nama_layanan"
                  name="nama_layanan"
                  value={formData.nama_layanan || ""}
                  onChange={handleFormChange}
                  required
                  autoFocus
                />
              </>
            )}
            {(modalState.type === "new_paket" ||
              modalState.type === "edit_paket") && (
              <>
                <div>
                  <Label htmlFor="nama_paket">Nama Paket</Label>
                  <Input
                    id="nama_paket"
                    name="nama_paket"
                    value={formData.nama_paket || ""}
                    onChange={handleFormChange}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="harga">Harga</Label>
                  <Input
                    id="harga"
                    name="harga"
                    type="number"
                    value={formData.harga || ""}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="estimasi_waktu">Estimasi Waktu</Label>
                  <Input
                    id="estimasi_waktu"
                    name="estimasi_waktu"
                    value={formData.estimasi_waktu || ""}
                    onChange={handleFormChange}
                    placeholder="Contoh: 2-3 Hari"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="satuan">Satuan</Label>
                  <Input
                    id="satuan"
                    name="satuan"
                    value={formData.satuan || ""}
                    onChange={handleFormChange}
                    placeholder="Contoh: kg/pcs"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="minimal_order">Minimal Order (Kg/Pcs)</Label>
                  <Input
                    id="minimal_order"
                    name="minimal_order" // <-- [FIX] TAMBAHKAN INI
                    type="number"
                    value={formData.minimal_order || ""}
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
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LayananManagementPage;
