// src/pages/PelangganManagementPage.jsx (VERSI ANTI-BOCOR & LENGKAP)

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePageVisibility } from "@/lib/usePageVisibility.js";
import { useNavigate } from "react-router-dom";

// ... (semua import komponen UI kamu tidak berubah)
import { Button } from "@/components/ui/Button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card.jsx";
import { Input } from "@/components/ui/Input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select.jsx";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/Table.jsx";
import { Badge } from "@/components/ui/Badge.jsx";
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
  DialogDescription,
} from "@/components/ui/Dialog.jsx";
import { Label } from "@/components/ui/Label.jsx";
import { Textarea } from "@/components/ui/Textarea.jsx";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form.jsx";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Users2,
  PlusCircle,
  Loader2,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState.jsx";

// PERUBAHAN #1: Gunakan nama kolom asli di blueprint
const formSchema = z.object({
  name: z.string().min(3, { message: "Nama minimal 3 karakter." }),
  phone_number: z
    .string()
    .regex(/^[0-9]+$/, { message: "Nomor HP hanya boleh berisi angka." })
    .min(10, { message: "Nomor HP minimal 10 digit." }),
  address: z.string().optional(),
  branch_id: z.string().optional(),
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

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", phone_number: "", address: "", branch_id: "" },
  });

  const fetchPelanggans = useCallback(async () => {
    if (!authState.business_id) return;
    try {
      setLoading(true);

      let query = supabase.from("customers").select("*, branches(name)");

      // PERUBAHAN #2: Filter berdasarkan business_id & branch_id
      query = query.eq("business_id", authState.business_id);
      query = query.eq("status", "aktif");
      if (authState.role !== "owner") {
        query = query.eq("branch_id", authState.branch_id);
      }

      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) throw error;

      // PERUBAHAN #3: Hapus "penerjemah", gunakan data apa adanya
      setPelanggans(data);
    } catch (err) {
      toast.error("Gagal mengambil data pelanggan.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, authState.business_id, authState.role, authState.branch_id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPelanggans();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchPelanggans]);

  // PERUBAHAN #4: Fetch cabang menggunakan supabase
  useEffect(() => {
    if (authState.role === "owner" && authState.business_id) {
      const fetchCabangsForOwner = async () => {
        const { data } = await supabase
          .from("branches")
          .select("*")
          .eq("business_id", authState.business_id);
        setCabangs(data || []);
      };
      fetchCabangsForOwner();
    }
  }, [authState.role, authState.business_id]);

  usePageVisibility(fetchPelanggans);

  async function onSubmit(data) {
    try {
      if (authState.role === "owner" && !data.branch_id) {
        toast.error("Owner wajib memilih cabang.");
        form.setError("branch_id", { message: "Cabang wajib diisi." });
        return;
      }

      // VVV INI DIA LOGIKA BARUNYA VVV
      const targetBranchId = data.branch_id
        ? parseInt(data.branch_id)
        : authState.branch_id;

      // 1. Cek dulu nomor HP ini udah ada apa belum
      const { data: existingCustomer, error: checkError } = await supabase
        .from("customers")
        .select("*")
        .eq("business_id", authState.business_id)
        .eq("phone_number", data.phone_number)
        .maybeSingle(); // maybeSingle() gak error kalo datanya null

      if (checkError) throw checkError;

      if (existingCustomer) {
        // --- DATA DITEMUKAN ---
        if (existingCustomer.status === "aktif") {
          // Kalo aktif, ya error
          toast.error(
            "Nomor HP ini sudah terdaftar atas nama: " + existingCustomer.name
          );
          form.setError("phone_number", {
            message: "Nomor HP sudah terdaftar.",
          });
          return;
        } else {
          // Kalo 'nonaktif', kita tanya!
          if (
            window.confirm(
              `Nomor HP ini sudah ada (status: Nonaktif) atas nama: ${existingCustomer.name}.\n\nAktifkan & update datanya?`
            )
          ) {
            // Kalo user klik "OK", kita UPDATE
            const { error: updateError } = await supabase
              .from("customers")
              .update({
                status: "aktif", // <-- AKTIFKAN LAGI
                name: data.name,
                address: data.address,
                branch_id: targetBranchId, // Update branch-nya juga
              })
              .eq("id", existingCustomer.id);

            if (updateError) throw updateError;
            toast.success(
              `Pelanggan "${data.name}" berhasil diaktifkan kembali!`
            );
          } else {
            // Kalo user klik "Cancel", gajadi ngapa-ngapain
            return;
          }
        }
      } else {
        // --- DATA GAK DITEMUKAN (NOMOR HP BARU) ---
        // 2. Kalo aman, baru INSERT
        const { error: insertError } = await supabase.from("customers").insert({
          name: data.name,
          phone_number: data.phone_number,
          address: data.address,
          branch_id: targetBranchId,
          business_id: authState.business_id,
          status: "aktif", // <-- Pastikan statusnya aktif
        });
        if (insertError) throw insertError;
        toast.success(`Pelanggan "${data.name}" berhasil dibuat!`);
      }

      // Kalo lolos (insert atau update), tutup modal & refresh
      setIsNewModalOpen(false);
      fetchPelanggans();
      form.reset();
    } catch (err) {
      toast.error(err.message || "Gagal memproses pelanggan.");
    }
  }

  // ... (Logika form Edit & Delete diperkuat)
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingPelanggan) return;
    try {
      // PERUBAHAN #6: Perkuat keamanan UPDATE
      const { error } = await supabase
        .from("customers")
        .update({
          name: editingPelanggan.name,
          phone_number: editingPelanggan.phone_number,
          address: editingPelanggan.address,
        })
        .eq("id", editingPelanggan.id)
        .eq("business_id", authState.business_id); // <-- BENTENG LAPIS KEDUA

      if (error) throw error;
      toast.success("Data pelanggan berhasil diupdate!");
      setIsEditModalOpen(false);
      fetchPelanggans();
    } catch (err) {
      toast.error(err.message || "Gagal mengupdate pelanggan.");
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditingPelanggan((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDelete = async (id) => {
    try {
      // VVV INI DIA PERUBAHANNYA VVV
      // Bukan .delete(), tapi .update()
      const { error } = await supabase
        .from("customers")
        .update({ status: "nonaktif" }) // <-- Ganti statusnya
        .eq("id", id)
        .eq("business_id", authState.business_id);
      // ^^^ SELESAI PERUBAHANNYA ^^^

      if (error) throw error;

      toast.success("Pelanggan berhasil di-nonaktifkan."); // <-- Ganti pesannya
      fetchPelanggans(); // Refresh data
    } catch (err) {
      // Kita udah gak perlu cek error 409 (23503) lagi
      toast.error(err.message || "Gagal me-nonaktifkan pelanggan.");
      console.error("Error Nonaktif Pelanggan:", err);
    }
  };

  const handleSelectCustomer = (customer) => {
    console.log("MENGIRIM CUSTOMER:", customer);
    // Kirim 'customer' utuh lewat 'state'
    navigate("/kasir", { state: { selectedCustomer: customer } });
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
            Cari dan kelola semua pelanggan terdaftar di bisnismu.
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
                    {authState.role === "owner" && (
                      <TableHead>Cabang</TableHead>
                    )}
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pelanggans?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell
                        className="font-medium text-primary cursor-pointer hover:underline"
                        onClick={() => handleSelectCustomer(p)}
                      >
                        {p.name}
                      </TableCell>
                      <TableCell>{p.phone_number}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {p.address || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.is_member ? "default" : "secondary"}>
                          {p.is_member ? "Member" : "Biasa"}
                        </Badge>
                      </TableCell>
                      {authState.role === "owner" && (
                        <TableCell>{p.branches?.name || "N/A"}</TableCell>
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
                              onClick={() => {
                                setEditingPelanggan(p);
                                setIsEditModalOpen(true);
                              }}
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
                                    Aksi ini akan menghapus pelanggan '{p.name}'
                                    secara permanen.
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

      {/* MODAL TAMBAH BARU */}
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
                name="name"
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
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor HP</FormLabel>
                    <FormControl>
                      <Input placeholder="08123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
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
              {authState.role === "owner" && (
                <FormField
                  control={form.control}
                  name="branch_id"
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
                          {cabangs?.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
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
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
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
          </Form>
        </DialogContent>
      </Dialog>

      {/* MODAL EDIT */}
      {editingPelanggan && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Data Pelanggan</DialogTitle>
              <DialogDescription>
                Perbarui detail untuk {editingPelanggan?.name}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateSubmit} className="py-4 space-y-4">
              <div>
                <Label htmlFor="edit-name">Nama</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={editingPelanggan?.name || ""}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-phone_number">Nomor HP</Label>
                <Input
                  id="edit-phone_number"
                  name="phone_number"
                  value={editingPelanggan?.phone_number || ""}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-address">Alamat</Label>
                <Textarea
                  id="edit-address"
                  name="address"
                  value={editingPelanggan?.address || ""}
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
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
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

export default PelangganManagementPage;
