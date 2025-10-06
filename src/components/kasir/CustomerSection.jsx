// src/components/kasir/CustomerSection.jsx

import React, { useState, useCallback, useEffect } from "react";
import api from "../../api/axiosInstance";
import { UserPlus, Star } from "lucide-react";
import { toast } from "sonner";

// Impor komponen dari shadcn/ui
import { Button } from "@/components/ui/Button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card.jsx";
import { Input } from "@/components/ui/Input.jsx";
import { Label } from "@/components/ui/Label.jsx";
import { Badge } from "@/components/ui/Badge.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/Dialog.jsx";
import { Textarea } from "@/components/ui/Textarea.jsx";

function CustomerSection({
  selectedPelanggan,
  onSelectPelanggan,
  onUpgradeMember,
  isPoinSystemActive,
  isPaidMembershipRequired,
  isUpgradingMember,
  onOpenPoinModal,
  pengaturan,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pelangganList, setPelangganList] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newPelangganData, setNewPelangganData] = useState({
    nama: "",
    nomor_hp: "",
    alamat: "",
  });

  const fetchPelanggan = useCallback(async () => {
    if (searchTerm.trim() === "") {
      setPelangganList([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await api.get(`/pelanggan?search=${searchTerm}`);
      setPelangganList(response.data);
    } catch (error) {
      console.error("Gagal mencari pelanggan:", error);
      toast.error("Gagal mencari pelanggan.");
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPelanggan();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchPelanggan]);

  const handleNewPelangganChange = (e) => {
    setNewPelangganData({
      ...newPelangganData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreatePelanggan = async (e) => {
    e.preventDefault();
    try {
      // 'newPelangganData' sekarang sudah berisi alamat
      const response = await api.post("/pelanggan", newPelangganData);
      onSelectPelanggan(response.data);
      setIsNewModalOpen(false);
      toast.success("Pelanggan baru berhasil dibuat!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal membuat pelanggan.");
    }
  };

  const openCreateModal = () => {
    // [FIX] Reset state, termasuk alamat
    setNewPelangganData({ nama: "", nomor_hp: "", alamat: "" });
    setIsNewModalOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pelanggan</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedPelanggan ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div>
                <p className="font-bold text-primary">
                  {selectedPelanggan.nama}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPelanggan.nomor_hp}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectPelanggan(null)}
              >
                Ganti
              </Button>
            </div>

            {/* [LOGIC] Tampilkan info member & poin HANYA JIKA sistem poin aktif */}
            {isPoinSystemActive && (
              <div className="border-t pt-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {isPaidMembershipRequired && (
                    <Badge
                      variant={
                        selectedPelanggan.status_member === "Aktif"
                          ? "success"
                          : "secondary"
                      }
                    >
                      {selectedPelanggan.status_member === "Aktif"
                        ? "Member"
                        : "Non-Member"}
                    </Badge>
                  )}
                  <span className="text-muted-foreground">
                    Poin: {selectedPelanggan.poin}
                  </span>
                </div>

                {/* [FIX] Logika tombol "Tukar Poin" diperbaiki */}
                <Button
                  onClick={onOpenPoinModal}
                  // Syarat disabled sekarang dinamis dari pengaturan
                  disabled={
                    selectedPelanggan.poin <
                    (pengaturan?.minimal_penukaran_poin || 10)
                  }
                  variant="secondary"
                  size="sm"
                >
                  <Star className="w-4 h-4 mr-2" /> Tukar Poin
                </Button>
              </div>
            )}

            {/* [LOGIC] Tombol Upgrade Member sekarang SANGAT dinamis */}
            {isPoinSystemActive &&
              isPaidMembershipRequired &&
              selectedPelanggan.status_member === "Non-Member" &&
              !isUpgradingMember && (
                <Button
                  onClick={onUpgradeMember}
                  variant="default"
                  size="sm"
                  className="w-full"
                >
                  Upgrade Jadi Member
                </Button>
              )}

            {isUpgradingMember && (
              <p className="text-sm text-green-500 text-center">
                Biaya membership telah ditambahkan ke keranjang.
              </p>
            )}
          </div>
        ) : (
          <div className="relative">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Cari nama atau nomor HP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary">
                    <UserPlus className="h-4 w-4 mr-2" /> Baru
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
                    <DialogDescription>
                      Masukkan detail pelanggan untuk mendaftarkannya.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={handleCreatePelanggan}
                    className="space-y-4 py-4"
                  >
                    <div>
                      <Label htmlFor="nama">Nama Pelanggan</Label>
                      <Input
                        id="nama"
                        name="nama"
                        value={newPelangganData.nama}
                        onChange={handleNewPelangganChange}
                        required
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label htmlFor="nomor_hp">Nomor HP</Label>
                      <Input
                        id="nomor_hp"
                        name="nomor_hp"
                        value={newPelangganData.nomor_hp}
                        onChange={handleNewPelangganChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="alamat">Alamat (Opsional)</Label>
                      <Textarea
                        id="alamat"
                        name="alamat"
                        value={newPelangganData.alamat}
                        onChange={handleNewPelangganChange}
                        placeholder="Masukkan alamat lengkap untuk layanan antar-jemput..."
                      />
                    </div>
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
                </DialogContent>
              </Dialog>
            </div>
            {isSearching && (
              <p className="text-muted-foreground mt-2 text-sm">Mencari...</p>
            )}
            {pelangganList.length > 0 && (
              <div className="absolute z-10 w-full mt-1">
                <Card className="max-h-60 overflow-y-auto">
                  {pelangganList.map((pelanggan) => (
                    <div
                      key={pelanggan.id}
                      onClick={() => {
                        onSelectPelanggan(pelanggan);
                        setSearchTerm("");
                      }}
                      className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    >
                      <p className="font-semibold">{pelanggan.nama}</p>
                      <p className="text-sm text-muted-foreground">
                        {pelanggan.nomor_hp}
                      </p>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CustomerSection;
