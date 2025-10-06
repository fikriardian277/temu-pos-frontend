// src/pages/UserManagementPage.jsx

import React, { useState, useEffect } from "react";
import api from "@/api/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import { MoreHorizontal, PlusCircle } from "lucide-react";

// Impor semua komponen baru dari shadcn/ui
import { Button } from "@/components/ui/Button.jsx";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";

function UserManagementPage() {
  const { authState } = useAuth();
  const [users, setUsers] = useState([]);
  const [cabangs, setCabangs] = useState([]);
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    username: "",
    password: "",
    role: "kasir",
    id_cabang: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // Untuk notifikasi sukses

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const userPromise = api.get("/pengguna");
      const cabangPromise =
        authState.user.role === "owner"
          ? api.get("/cabang")
          : Promise.resolve({ data: [] });
      const [userResponse, cabangResponse] = await Promise.all([
        userPromise,
        cabangPromise,
      ]);
      setUsers(userResponse.data);
      setCabangs(cabangResponse.data);
    } catch (err) {
      setError("Gagal mengambil data dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.user) fetchData();
  }, [authState.user]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await api.post("/pengguna/register", formData);
      setMessage(response.data.message);
      fetchData();
      setIsCreateModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal membuat user.");
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await api.put(
        `/pengguna/${editingUser.id}`,
        editingUser
      );
      setMessage(response.data.message);
      fetchData();
      setIsEditModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengupdate user.");
    }
  };

  const handleDelete = async (userId) => {
    try {
      const response = await api.delete(`/pengguna/${userId}`);
      setMessage(response.data.message);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menghapus user.");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Staff</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setError("");
                setFormData({
                  nama_lengkap: "",
                  username: "",
                  password: "",
                  role: "kasir",
                  id_cabang: "",
                });
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <DialogDescription>
                Isi detail di bawah ini untuk membuat user baru.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="grid gap-4 py-4">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nama_lengkap" className="text-right">
                  Nama Lengkap
                </Label>
                <Input
                  id="nama_lengkap"
                  value={formData.nama_lengkap}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_lengkap: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
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
                    {authState.user?.role === "owner" && (
                      <SelectItem value="admin">Admin</SelectItem>
                    )}
                    <SelectItem value="kasir">Kasir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {authState.user?.role === "owner" &&
                formData.role === "admin" && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="id_cabang" className="text-right">
                      Cabang
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        setFormData({ ...formData, id_cabang: value })
                      }
                      defaultValue={formData.id_cabang}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Pilih cabang" />
                      </SelectTrigger>
                      <SelectContent>
                        {cabangs.map((cabang) => (
                          <SelectItem key={cabang.id} value={String(cabang.id)}>
                            {cabang.nama_cabang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              <DialogFooter>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Cari user berdasarkan nama atau username..."
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
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.nama_lengkap}
                    </TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>
                      {cabangs.find((c) => c.id === user.id_cabang)
                        ?.nama_cabang ||
                        (user.role === "owner" ? "Global" : "N/A")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Buka menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingUser(user);
                              setIsEditModalOpen(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
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
                                  Aksi ini akan menonaktifkan user '
                                  {user.username}'. Anda bisa mengaktifkannya
                                  kembali nanti.
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
                  <TableCell colSpan={5} className="text-center">
                    Tidak ada data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Edit (mirip dengan modal create) */}
      {editingUser && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User: {editingUser.username}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateSubmit} className="grid gap-4 py-4">
              {/* ... form fields untuk edit, mirip dengan form create ... */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-nama_lengkap" className="text-right">
                  Nama Lengkap
                </Label>
                <Input
                  id="edit-nama_lengkap"
                  value={editingUser.nama_lengkap || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      nama_lengkap: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Role
                </Label>
                <Select
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, role: value })
                  }
                  defaultValue={editingUser.role}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    {authState.user?.role === "owner" && (
                      <SelectItem value="admin">Admin</SelectItem>
                    )}
                    <SelectItem value="kasir">Kasir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* ... tambahkan field lain jika perlu diedit ... */}
              <DialogFooter>
                <Button type="submit">Simpan Perubahan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default UserManagementPage;
