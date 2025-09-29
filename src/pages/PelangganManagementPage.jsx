// src/pages/PelangganManagementPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { MoreHorizontal, PlusCircle } from "lucide-react";

// Impor semua komponen shadcn/ui yang kita butuhkan
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function PelangganManagementPage() {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [pelanggans, setPelanggans] = useState([]);
  const [formData, setFormData] = useState({
    nama: "",
    nomor_hp: "",
    id_cabang: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPelanggan, setEditingPelanggan] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cabangs, setCabangs] = useState([]);

  const fetchPelanggans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/pelanggan?search=${searchTerm}`);
      setPelanggans(response.data);
    } catch (err) {
      setError("Gagal mengambil data pelanggan.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPelanggans();
      // Ambil data cabang JIKA user adalah owner
      if (authState.user?.role === "owner") {
        api
          .get("/cabang")
          .then((response) => {
            setCabangs(response.data);
          })
          .catch((err) => console.error("Gagal mengambil data cabang", err));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchPelanggans, authState.user?.role]);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSelectChange = (name, value) =>
    setFormData({ ...formData, [name]: value });

  const handleEditInputChange = (e) =>
    setEditingPelanggan({
      ...editingPelanggan,
      [e.target.name]: e.target.value,
    });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await api.post("/pelanggan", formData);
      setMessage(`Pelanggan "${formData.nama}" berhasil dibuat!`);
      // [FIX] Reset semua field, termasuk id_cabang
      setFormData({ nama: "", nomor_hp: "", id_cabang: "" });
      fetchPelanggans();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal membuat pelanggan.");
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await api.put(
        `/pelanggan/${editingPelanggan.id}`,
        editingPelanggan
      );
      setMessage(response.data.message); // Ambil pesan dari respons backend agar lebih konsisten
      setIsEditModalOpen(false); // <-- PERBAIKANNYA
      fetchPelanggans();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengupdate pelanggan.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus pelanggan ini?")) {
      setMessage("");
      setError("");
      try {
        await api.delete(`/pelanggan/${id}`);
        setMessage("Pelanggan berhasil dihapus.");
        fetchPelanggans();
      } catch (err) {
        setError(err.response?.data?.message || "Gagal menghapus pelanggan.");
      }
    }
  };

  const handleSelectAndGoToKasir = (pelanggan) => {
    navigate("/kasir", { state: { pelangganTerpilih: pelanggan } });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manajemen Pelanggan</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Tambah Pelanggan Baru</CardTitle>
          <CardDescription>
            Masukkan nama, nomor HP, dan cabang (jika Anda Owner).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && <p className="text-green-500 text-sm mb-4">{message}</p>}
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form
            onSubmit={handleCreateSubmit}
            className="flex flex-col md:flex-row gap-4 items-end"
          >
            <div className="flex-grow w-full">
              <Label htmlFor="nama">Nama</Label>
              <Input
                id="nama"
                name="nama"
                value={formData.nama}
                onChange={handleInputChange}
                placeholder="Nama Pelanggan"
                required
              />
            </div>
            <div className="flex-grow w-full">
              <Label htmlFor="nomor_hp">Nomor HP</Label>
              <Input
                id="nomor_hp"
                name="nomor_hp"
                value={formData.nomor_hp}
                onChange={handleInputChange}
                placeholder="Nomor HP"
                required
              />
            </div>
            {authState.user?.role === "owner" && (
              <div className="flex-grow w-full">
                <Label htmlFor="id_cabang">Cabang</Label>
                <Select
                  name="id_cabang"
                  value={formData.id_cabang}
                  onValueChange={(value) =>
                    handleSelectChange(
                      "id_cabang",
                      value === "all" ? "" : value
                    )
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="-- Pilih Cabang --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">-- Pilih Cabang --</SelectItem>
                    {cabangs.map((cabang) => (
                      <SelectItem key={cabang.id} value={String(cabang.id)}>
                        {cabang.nama_cabang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button type="submit" className="w-full md:w-auto">
              <PlusCircle className="h-4 w-4 mr-2" /> Tambah
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pelanggan</CardTitle>
          <CardDescription>
            Cari dan kelola semua pelanggan terdaftar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Cari nama atau nomor HP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>{/* ... Header Tabel ... */}</TableHeader>
                <TableBody>
                  {/* ... Isi Tabel ... */}
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Memuat...
                      </TableCell>
                    </TableRow>
                  ) : (
                    pelanggans.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell
                          className="font-medium text-primary cursor-pointer"
                          onClick={() => handleSelectAndGoToKasir(p)}
                        >
                          {p.nama}
                        </TableCell>
                        <TableCell>{p.nomor_hp}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.status_member === "Aktif"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {p.status_member}
                          </Badge>{" "}
                          ({p.poin} Poin)
                        </TableCell>
                        {authState.user?.role === "owner" && (
                          <TableCell>
                            {p.Cabang?.nama_cabang || "N/A"}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* Edit hanya untuk owner & admin */}
                              {(authState.user?.role === "owner" ||
                                authState.user?.role === "admin") && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingPelanggan(p);
                                    setIsEditModalOpen(true);
                                  }}
                                >
                                  Edit
                                </DropdownMenuItem>
                              )}

                              {/* Hapus hanya untuk owner */}
                              {authState.user?.role === "owner" && (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDelete(p.id)}
                                >
                                  Hapus
                                </DropdownMenuItem>
                              )}
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

      {editingPelanggan && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Pelanggan: {editingPelanggan.nama}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-nama">Nama Lengkap</Label>
                <Input
                  id="edit-nama"
                  name="nama"
                  value={editingPelanggan.nama || ""}
                  onChange={handleEditInputChange}
                />
              </div>
              <div>
                <Label htmlFor="edit-nomor_hp">Nomor HP</Label>
                <Input
                  id="edit-nomor_hp"
                  name="nomor_hp"
                  value={editingPelanggan.nomor_hp || ""}
                  onChange={handleEditInputChange}
                />
              </div>
              {/* Kamu bisa tambahkan input untuk edit data lain di sini jika perlu */}
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

export default PelangganManagementPage;
