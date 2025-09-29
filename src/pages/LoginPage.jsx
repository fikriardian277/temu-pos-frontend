import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/api/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
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

// ✅ React Icon Google
import { FcGoogle } from "react-icons/fc";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/pengguna/login", {
        username,
        password,
      });
      const { accessToken } = response.data;
      if (accessToken) {
        await login(accessToken);
        navigate("/dashboard", { replace: true });
      } else {
        setError("Login gagal, tidak menerima token.");
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
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <img
            src="/logo.png"
            alt="App Logo"
            className="w-16 h-16 mx-auto mb-2"
          />
          <CardTitle className="text-2xl font-bold">Selamat Datang</CardTitle>
          <CardDescription>
            Masukkan username dan password Anda untuk masuk ke akun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Username Anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>

            {/* ✅ Tombol Google pakai react-icons */}
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              type="button"
              asChild
            >
              <a href="http://localhost:3000/api/pengguna/auth/google">
                <FcGoogle className="w-5 h-5 mr-2" />
                Lanjutkan dengan Google
              </a>
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Belum punya akun?{" "}
            <Link to="/register" className="underline font-medium text-primary">
              Daftarkan Usaha
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
