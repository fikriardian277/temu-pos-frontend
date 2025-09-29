// src/pages/RegisterPage.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/api/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

// Impor komponen-komponen dari shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function RegisterPage() {
  const [formData, setFormData] = useState({
    nama_usaha: "",
    nama_lengkap: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/usaha/register", formData);
      const { accessToken } = response.data;
      if (accessToken) {
        login(accessToken);
        navigate("/dashboard", { replace: true });
      } else {
        setError(
          "Registrasi berhasil, tapi login otomatis gagal. Silakan coba login manual."
        );
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Terjadi kesalahan. Coba lagi.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="mx-auto max-w-sm">
        <CardHeader className="text-center">
          <img
            src="/logo.png"
            alt="App Logo"
            className="w-16 h-16 mx-auto mb-2"
          />
          <CardTitle className="text-2xl">Daftarkan Usaha Anda</CardTitle>
          <CardDescription>
            Buat akun owner dan mulai kelola bisnis laundry Anda hari ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nama_usaha">Nama Usaha</Label>
              <Input
                id="nama_usaha"
                name="nama_usaha"
                value={formData.nama_usaha}
                onChange={handleChange}
                placeholder="Contoh: Superclean Laundry"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nama_lengkap">Nama Lengkap Owner</Label>
              <Input
                id="nama_lengkap"
                name="nama_lengkap"
                value={formData.nama_lengkap}
                onChange={handleChange}
                placeholder="Contoh: Diki Gunawan"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username untuk login"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contoh@email.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Daftar & Buat Akun
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/login" className="underline font-semibold text-primary">
              Login di sini
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RegisterPage;
