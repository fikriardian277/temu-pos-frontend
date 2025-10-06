// src/pages/PelangganManagementPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table.jsx";
import { Badge } from "@/components/ui/badge.jsx";
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
  DialogDescription,
} from "@/components/ui/dialog.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.jsx";
import { MoreHorizontal, Edit, Trash2, Users2, PlusCircle } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState.jsx";

// Blueprint validasi Zod
const formSchema = z.object({
  nama: z.string().min(3, { message: "Nama minimal 3 karakter." }),
  nomor_hp: z
    .string()
    .regex(/^[0-9]+$/, { message: "Nomor HP hanya boleh berisi angka." })
    .min(10, { message: "Nomor HP minimal 10 digit." }),
  alamat: z.string().optional(),
  id_cabang: z.string().optional(),
});

function PelangganManagementPage() {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [pelanggans, setPelanggans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cabangs, setCabangs] = useState([]);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPelanggan, setEditingPelanggan] = useState(null);

  // Inisialisasi React Hook Form untuk modal TAMBAH BARU
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { nama: "", nomor_hp: "", alamat: "", id_cabang: "" },
  });

  // Logika fetching data yang stabil
  const fetchPelanggans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/pelanggan?search=${searchTerm}`);
      setPelanggans(response.data);
    } catch (err) {
      toast.error("Gagal mengambil data pelanggan.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPelanggans();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchPelanggans]);

  useEffect(() => {
    if (authState.user?.role === "owner") {
      api.get("/cabang").then((res) => setCabangs(res.data));
    }
  }, [authState.user?.role]);

  // Fungsi onSubmit untuk form tambah baru
  async function onSubmit(data) {
    try {
      // Jika owner tapi tidak pilih cabang, beri error
      if (authState.user?.role === "owner" && !data.id_cabang) {
        form.setError("id_cabang", {
          type: "manual",
          message: "Owner harus memilih cabang.",
        });
        return;
      }
      await api.post("/pelanggan", data);
      toast.success(`Pelanggan "${data.nama}" berhasil dibuat!`);
      setIsNewModalOpen(false);
      fetchPelanggans();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal membuat pelanggan.");
    }
  }

  // Handler untuk form EDIT
  const handleEditFormChange = (e) =>
    setEditingPelanggan((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  const handleOpenEditModal = (pelanggan) => {
    setEditingPelanggan(pelanggan);
    setIsEditModalOpen(true);
  };
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingPelanggan) return;
    try {
      const response = await api.put(
        `/pelanggan/${editingPelanggan.id}`,
        editingPelanggan
      );
      toast.success(response.data.message);
      setIsEditModalOpen(false);
      fetchPelanggans();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengupdate pelanggan.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/pelanggan/${id}`);
      toast.success("Pelanggan berhasil dihapus.");
      fetchPelanggans();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus pelanggan.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Pelanggan</h1>
        <Button
          onClick={() => {
            form.reset();
            setIsNewModalOpen(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Pelanggan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pelanggan</CardTitle>
          <CardDescription>
            Cari dan kelola semua pelanggan terdaftar.
          </CardDescription>
          <Input
            type="text"
            placeholder="Cari nama atau nomor HP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-4"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-10">Memuat data...</p>
          ) : pelanggans.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Nomor HP</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Status</TableHead>
                    {authState.user?.role === "owner" && (
                      <TableHead>Cabang</TableHead>
                    )}
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pelanggans.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-primary">
                        {p.nama}
                      </TableCell>
                      <TableCell>{p.nomor_hp}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {p.alamat || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status_member === "Aktif"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {p.status_member}
                        </Badge>
                      </TableCell>
                      {authState.user?.role === "owner" && (
                        <TableCell>{p.Cabang?.nama_cabang || "N/A"}</TableCell>
                      )}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleOpenEditModal(p)}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Anda Yakin?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Aksi ini akan menghapus pelanggan secara
                                    permanen.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(p.id)}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={<Users2 className="h-16 w-16" />}
              title="Pelanggan Tidak Ditemukan"
              description="Tidak ada pelanggan yang cocok dengan pencarian Anda, atau Anda belum mendaftarkan pelanggan sama sekali."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
            <DialogDescription>
              Masukkan detail pelanggan baru. Klik simpan jika sudah selesai.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4"
            >
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nama Pelanggan"
                        {...field}
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nomor_hp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor HP</FormLabel>
                    <FormControl>
                      <Input placeholder="Nomor HP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alamat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Alamat untuk antar-jemput..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {authState.user?.role === "owner" && (
                <FormField
                  control={form.control}
                  name="id_cabang"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cabang</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="-- Pilih Cabang --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cabangs.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.nama_cabang}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsNewModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data Pelanggan</DialogTitle>
            <DialogDescription>
              Perbarui detail untuk {editingPelanggan?.nama}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="py-4 space-y-4">
            <div>
              <Label htmlFor="edit-nama">Nama</Label>
              <Input
                id="edit-nama"
                name="nama"
                value={editingPelanggan?.nama || ""}
                onChange={handleEditFormChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-nomor_hp">Nomor HP</Label>
              <Input
                id="edit-nomor_hp"
                name="nomor_hp"
                value={editingPelanggan?.nomor_hp || ""}
                onChange={handleEditFormChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-alamat">Alamat</Label>
              <Textarea
                id="edit-alamat"
                name="alamat"
                value={editingPelanggan?.alamat || ""}
                onChange={handleEditFormChange}
                placeholder="Alamat lengkap..."
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
    </div>
  );
}

export default PelangganManagementPage;
