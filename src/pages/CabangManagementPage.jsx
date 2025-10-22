// src/pages/CabangManagementPage.jsx (VERSI FINAL & LENGKAP)

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabaseClient"; // <-- GANTI INI
import { useAuth } from "@/context/AuthContext"; // <-- Tambahkan ini untuk akses authState
import { toast } from "sonner";
import { MoreHorizontal, PlusCircle, Loader2 } from "lucide-react";
import { usePageVisibility } from "@/lib/usePageVisibility.js";

// Impor komponen-komponen UI (tidak ada yang berubah)
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
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/Table.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown-menu.jsx";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/Dialog.jsx";

function CabangManagementPage() {
  const { authState } = useAuth();
  const [cabangs, setCabangs] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone_number: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCabang, setEditingCabang] = useState(null);

  const fetchCabangs = useCallback(async () => {
    // Jangan fetch jika business_id belum siap
    if (!authState.business_id) return;

    try {
      setLoading(true);
      // VVV PERUBAHAN KRUSIAL #1: FILTER BERDASARKAN business_id VVV
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("business_id", authState.business_id) // <-- Filter wajib!
        .order("created_at");

      if (error) throw error;
      setCabangs(data);
    } catch (err) {
      toast.error("Gagal mengambil data cabang: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [authState.business_id]); // <-- Dependency diubah ke business_id

  useEffect(() => {
    fetchCabangs();
  }, [fetchCabangs]);

  // Pasang sensor anti-macet
  usePageVisibility(fetchCabangs);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEditInputChange = (e) =>
    setEditingCabang({ ...editingCabang, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // VVV PERUBAHAN KRUSIAL #2: SERTAKAN business_id SAAT INSERT VVV
      const { error } = await supabase.from("branches").insert({
        name: formData.name,
        address: formData.address,
        phone_number: formData.phone_number,
        business_id: authState.business_id, // <-- Wajib ada!
      });
      if (error) throw error;

      toast.success(`Cabang "${formData.name}" berhasil dibuat!`);
      setFormData({ name: "", address: "", phone_number: "" });
      setIsCreateModalOpen(false);
      fetchCabangs();
    } catch (err) {
      toast.error(err.message || "Gagal membuat cabang.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // VVV PERUBAHAN KRUSIAL #3: PERKUAT KEAMANAN UPDATE VVV
      const { error } = await supabase
        .from("branches")
        .update({
          name: editingCabang.name,
          address: editingCabang.address,
          phone_number: editingCabang.phone_number,
        })
        .eq("id", editingCabang.id)
        .eq("business_id", authState.business_id); // <-- Filter keamanan tambahan!

      if (error) throw error;

      toast.success("Cabang berhasil diupdate!");
      setIsEditModalOpen(false);
      setEditingCabang(null);
      fetchCabangs();
    } catch (err) {
      toast.error(err.message || "Gagal mengupdate cabang.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cabangId) => {
    try {
      // VVV PERUBAHAN KRUSIAL #4: PERKUAT KEAMANAN DELETE VVV
      const { error } = await supabase
        .from("branches")
        .delete()
        .eq("id", cabangId)
        .eq("business_id", authState.business_id); // <-- Filter keamanan tambahan!

      if (error) throw error;

      toast.success("Cabang berhasil dihapus.");
      fetchCabangs();
    } catch (err) {
      toast.error(err.message || "Gagal menghapus cabang.");
    }
  };

  // Logika untuk hanya menampilkan halaman ini ke owner
  if (authState.role !== "owner") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Akses Ditolak</h1>
        <p>Hanya Owner yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  // Bagian JSX di bawah ini TIDAK ADA YANG BERUBAH.
  // Lo bisa langsung copy-paste dari kode lama lo kalau mau.
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Cabang</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                // BENERIN: Gunakan nama kolom asli dari database
                setFormData({ name: "", address: "", phone_number: "" });
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nama Cabang
                </Label>
                <Input
                  id="name"
                  name="name" // BENERIN
                  value={formData.name} // BENERIN
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Alamat
                </Label>
                <Input
                  id="address"
                  name="address" // BENERIN
                  value={formData.address} // BENERIN
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone_number" className="text-right">
                  Telepon
                </Label>
                <Input
                  id="phone_number"
                  name="phone_number" // BENERIN
                  value={formData.phone_number} // BENERIN
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Cabang"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
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
                    cabangs?.map((cabang) => (
                      <TableRow key={cabang.id}>
                        <TableCell className="font-medium">
                          {cabang.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {cabang.address}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {cabang.phone_number}
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
                                      {cabang.name}'. Aksi ini tidak dapat
                                      dibatalkan.
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
      {editingCabang && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Cabang: {editingCabang.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nama Cabang
                </Label>
                <Input
                  id="edit-name"
                  name="name" // BENERIN
                  value={editingCabang.name || ""} // BENERIN
                  onChange={handleEditInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-address" className="text-right">
                  Alamat
                </Label>
                <Input
                  id="edit-address"
                  name="address" // BENERIN
                  value={editingCabang.address || ""} // BENERIN
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone_number" className="text-right">
                  Telepon
                </Label>
                <Input
                  id="edit-phone_number"
                  name="phone_number" // BENERIN
                  value={editingCabang.phone_number || ""} // BENERIN
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default CabangManagementPage;
