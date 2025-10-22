// src/pages/UserManagementPage.jsx (VERSI JALAN TIKUS)

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { MoreHorizontal, PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button.jsx";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select.jsx";

function UserManagementPage() {
  const { authState } = useAuth();
  const [users, setUsers] = useState([]);
  const [cabangs, setCabangs] = useState([]);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "kasir",
    branch_id: "",
  });
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let userQuery = supabase.from("profiles").select("*, branches(name)");
      if (authState.role === "admin") {
        userQuery = userQuery
          .eq("role", "kasir")
          .eq("branch_id", authState.branch_id);
      } else if (authState.role === "owner") {
        userQuery = userQuery.not("id", "eq", authState.user.id);
      }
      if (searchTerm) {
        userQuery = userQuery.or(
          `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }
      const userPromise = userQuery.order("created_at");
      const cabangPromise =
        authState.role === "owner"
          ? supabase.from("branches").select("*")
          : Promise.resolve({ data: [] });
      const [userResponse, cabangResponse] = await Promise.all([
        userPromise,
        cabangPromise,
      ]);
      if (userResponse.error) throw userResponse.error;
      if (cabangResponse.error) throw cabangResponse.error;
      setUsers(userResponse.data);
      setCabangs(cabangResponse.data);
    } catch (err) {
      toast.error("Gagal mengambil data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [authState.role, authState.user?.id, authState.branch_id, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (authState.role) fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [authState.role, fetchData]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (!authState.business_id) {
      return toast.error(
        "Error: ID Bisnis tidak ditemukan. Coba logout dan login kembali."
      );
    }

    if (authState.role === "owner" && !formData.branch_id) {
      return toast.error("Owner harus memilih cabang untuk staff baru.");
    }

    setIsSubmitting(true); // Pelayan mulai sibuk

    try {
      const { data, error } = await supabase.functions.invoke("create-staff", {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
          branch_id:
            authState.role === "admin"
              ? authState.branch_id
              : parseInt(formData.branch_id),
          business_id: authState.business_id,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(data.message || "Staff baru berhasil dibuat!");
      fetchData(); // Setelah sukses, panggil fetchData untuk renovasi (memuat ulang) tabel
      setIsCreateModalOpen(false);
    } catch (err) {
      toast.error("Gagal membuat staff: " + err.message);
    } finally {
      setIsSubmitting(false); // Apapun hasilnya, pelayan berhenti sibuk
    }
  };

  const handleDelete = async (userId) => {
    // Kita akan gunakan RPC yang sudah ada, tapi harus dibuat ulang jika tadi terhapus
    try {
      const { error } = await supabase.rpc("delete_staff_user", {
        user_id_to_delete: userId,
      });
      if (error) throw error;
      toast.success("Staff berhasil dihapus.");
      fetchData();
    } catch (err) {
      toast.error("Gagal menghapus staff: " + err.message);
    }
  };

  if (authState.role !== "owner" && authState.role !== "admin") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Akses Ditolak</h1>
        <p>Hanya Owner & Admin yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Staff</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() =>
                setFormData({
                  full_name: "",
                  email: "",
                  password: "",
                  role: "kasir",
                  branch_id: "",
                })
              }
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Tambah Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Staff Baru</DialogTitle>
              <DialogDescription>
                Isi detail di bawah untuk mendaftarkan staff baru.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full_name" className="text-right">
                  Nama Lengkap
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                  defaultValue={formData.role}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    {authState.role === "owner" && (
                      <SelectItem value="admin">Admin</SelectItem>
                    )}
                    <SelectItem value="kasir">Kasir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {authState.role === "owner" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="branch_id" className="text-right">
                    Cabang
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setFormData({ ...formData, branch_id: value })
                    }
                    required
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Pilih cabang" />
                    </SelectTrigger>
                    <SelectContent>
                      {cabangs?.map((cabang) => (
                        <SelectItem key={cabang.id} value={String(cabang.id)}>
                          {cabang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Staff"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Cari staff berdasarkan nama atau email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Memuat data staff...
                  </TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>{user.branches?.name || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-500 focus:text-red-500"
                              >
                                Hapus
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Aksi ini akan menghapus user '{user.full_name}
                                  ' secara permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(user.id)}
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
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Belum ada staff yang ditambahkan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default UserManagementPage;
