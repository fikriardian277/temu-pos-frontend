// src/pages/AkunPage.jsx

import React, { useState, useEffect } from "react";
import api from "@/api/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom"; // <-- Import Link
import { KeyRound, User, History, LogOut } from "lucide-react";

// Impor komponen-komponen dari shadcn/ui
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.jsx";

function InfoProfil({ initialData, onUpdate }) {
  const [formData, setFormData] = useState({
    nama_lengkap: initialData.nama_lengkap,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await api.put("/akun/profil", formData);
      onUpdate(response.data.user);
      setMessage("Profil berhasil diperbarui!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Gagal update profil", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && <p className="text-sm text-green-500">{message}</p>}
      <div>
        <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
        <Input
          id="nama_lengkap"
          value={formData.nama_lengkap}
          onChange={(e) => setFormData({ nama_lengkap: e.target.value })}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Profil"}
        </Button>
      </div>
    </form>
  );
}

function UbahPassword() {
  const [formData, setFormData] = useState({
    password_lama: "",
    password_baru: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await api.put("/akun/ubah-password", formData);
      setMessage(response.data.message);
      setFormData({ password_lama: "", password_baru: "" });
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengubah password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && <p className="text-sm text-green-500">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div>
        <Label htmlFor="password_lama">Password Lama</Label>
        <Input
          id="password_lama"
          type="password"
          value={formData.password_lama}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, password_lama: e.target.value }))
          }
        />
      </div>
      <div>
        <Label htmlFor="password_baru">Password Baru</Label>
        <Input
          id="password_baru"
          type="password"
          value={formData.password_baru}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, password_baru: e.target.value }))
          }
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Menyimpan..." : "Ubah Password"}
        </Button>
      </div>
    </form>
  );
}

function AkunPage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { authState, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/akun/profil")
      .then((response) => setUserData(response.data))
      .catch((error) => console.error("Gagal mengambil data user:", error))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) return <p className="text-center">Memuat data akun...</p>;
  if (!userData)
    return (
      <p className="text-center text-destructive">Gagal memuat data akun.</p>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan Akun</h1>
        <p className="text-muted-foreground">
          Kelola informasi profil dan keamanan akun Anda.
        </p>
      </div>

      <Tabs defaultValue="profil" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profil">
            <User className="w-4 h-4 mr-2" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="keamanan">
            <KeyRound className="w-4 h-4 mr-2" />
            Keamanan
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profil">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Profil</CardTitle>
              <CardDescription>
                Perbarui nama lengkap Anda yang akan ditampilkan di aplikasi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InfoProfil initialData={userData} onUpdate={setUserData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="keamanan">
          <Card>
            <CardHeader>
              <CardTitle>Ubah Password</CardTitle>
              <CardDescription>
                Ganti password Anda secara berkala untuk menjaga keamanan akun.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UbahPassword />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* [FIX] Tampilkan seksi ini hanya untuk Kasir */}
      {authState.user?.role === "kasir" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Aksi Cepat</h2>
          <Card>
            <CardContent className="p-4">
              <Link
                to="/riwayat"
                className="flex items-center justify-between text-sm font-medium hover:text-primary"
              >
                <div className="flex items-center">
                  <History className="w-4 h-4 mr-3" />
                  <span>Lihat Riwayat Transaksi</span>
                </div>
              </Link>
            </CardContent>
          </Card>
          <div className="mt-8 pt-8 border-t flex justify-end md:hidden">
            <Button onClick={handleLogout} variant="destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AkunPage;
