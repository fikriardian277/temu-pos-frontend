import React, { useState, useEffect } from "react"; // <-- MEMPERBAIKI 'useState' & 'useEffect' is not defined
import api from "../api/axiosInstance"; // <-- MEMPERBAIKI 'api' is not defined
import { MoreHorizontal, PlusCircle } from "lucide-react";

// Impor komponen-komponen dari shadcn/ui (dengan .jsx untuk Vercel)
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
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog.jsx";

function CabangManagementPage() {
  const [cabangs, setCabangs] = useState([]);
  const [formData, setFormData] = useState({
    nama_cabang: "",
    alamat: "",
    nomor_telepon: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCabang, setEditingCabang] = useState(null);

  const fetchCabangs = async () => {
    try {
      if (!loading) setLoading(true);
      const response = await api.get("/cabang");
      setCabangs(response.data);
    } catch (err) {
      setError("Gagal mengambil data cabang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCabangs();
  }, []);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEditInputChange = (e) =>
    setEditingCabang({ ...editingCabang, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await api.post("/cabang", formData);
      setMessage(
        response.data.message ||
          `Cabang "${formData.nama_cabang}" berhasil dibuat!`
      );
      setFormData({ nama_cabang: "", alamat: "", nomor_telepon: "" });
      setIsCreateModalOpen(false); // Tutup modal setelah sukses
      fetchCabangs();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal membuat cabang.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await api.put(
        `/cabang/${editingCabang.id}`,
        editingCabang
      );
      setMessage(response.data.message);
      setIsEditModalOpen(false); // [FIX] Gunakan state yang benar
      setEditingCabang(null);
      fetchCabangs();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengupdate cabang.");
    }
  };

  const handleDelete = async (cabangId) => {
    try {
      const response = await api.delete(`/cabang/${cabangId}`);
      setMessage(response.data.message);
      fetchCabangs();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menghapus cabang.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Cabang</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setError("");
                setFormData({ nama_cabang: "", alamat: "", nomor_telepon: "" });
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Tambah Cabang
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Cabang Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              {error && <p className="text-destructive text-sm">{error}</p>}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nama_cabang" className="text-right">
                  Nama Cabang
                </Label>
                <Input
                  id="nama_cabang"
                  name="nama_cabang"
                  value={formData.nama_cabang}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="alamat" className="text-right">
                  Alamat
                </Label>
                <Input
                  id="alamat"
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nomor_telepon" className="text-right">
                  Telepon
                </Label>
                <Input
                  id="nomor_telepon"
                  name="nomor_telepon"
                  value={formData.nomor_telepon}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <DialogFooter>
                <Button type="submit">Simpan Cabang</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {message && (
        <p className="text-green-500 text-sm mb-4 text-center">{message}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Cabang</CardTitle>
          <CardDescription>
            Semua cabang yang terdaftar di usaha Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Cabang</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Memuat data cabang...
                      </TableCell>
                    </TableRow>
                  ) : (
                    cabangs.map((cabang) => (
                      <TableRow key={cabang.id}>
                        <TableCell className="font-medium">
                          {cabang.nama_cabang}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {cabang.alamat}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {cabang.nomor_telepon}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingCabang(cabang);
                                  setIsEditModalOpen(true);
                                  setError("");
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    Hapus
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Anda Yakin?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Aksi ini akan menghapus cabang '
                                      {cabang.nama_cabang}'. Aksi ini tidak
                                      dapat dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(cabang.id)}
                                    >
                                      Ya, Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Edit Cabang */}
      {editingCabang && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                Edit Cabang: {editingCabang.nama_cabang}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="grid gap-4 py-4">
              {error && <p className="text-destructive text-sm">{error}</p>}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-nama_cabang" className="text-right">
                  Nama Cabang
                </Label>
                <Input
                  id="edit-nama_cabang"
                  name="nama_cabang"
                  value={editingCabang.nama_cabang || ""}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-alamat" className="text-right">
                  Alamat
                </Label>
                <Input
                  id="edit-alamat"
                  name="alamat"
                  value={editingCabang.alamat || ""}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-nomor_telepon" className="text-right">
                  Telepon
                </Label>
                <Input
                  id="edit-nomor_telepon"
                  name="nomor_telepon"
                  value={editingCabang.nomor_telepon || ""}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit">Simpan Perubahan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default CabangManagementPage;
