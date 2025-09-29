// Di file: src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
  Navigate, // Pastikan Navigate diimpor
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "@/components/ui/sonner";

import { jwtDecode } from "jwt-decode";
import "antd/dist/reset.css";
import "./index.css";

// Impor Layouts
import RoleBasedLayout from "./layouts/RoleBasedLayout.jsx";

// Impor Halaman
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LayananManagementPage from "./pages/LayananManagementPage.jsx";
import UserManagementPage from "./pages/UserManagementPage.jsx";
import CabangManagementPage from "./pages/CabangManagementPage.jsx";
import PelangganManagementPage from "./pages/PelangganManagementPage.jsx";
import KasirPage from "./pages/KasirPage.jsx";
import ProsesPage from "./pages/ProsesPage.jsx";
import RiwayatPage from "./pages/RiwayatPage.jsx";
import AkunPage from "./pages/AkunPage.jsx";
import LaporanPage from "./pages/LaporanPage.jsx";
import PesananPage from "./pages/PesananPage.jsx";
import PengaturanUsahaPage from "./pages/PengaturanUsahaPage.jsx";
import LoginSuccessPage from "./pages/LoginSuccessPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import RiwayatDetailPage from "./pages/RiwayatDetailPage.jsx";

// Fungsi Loader (tidak berubah)
const checkAuth = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return redirect("/login");
  }
  try {
    const decodedUser = jwtDecode(token);
    if (decodedUser.exp * 1000 < Date.now()) {
      localStorage.removeItem("accessToken");
      return redirect("/login");
    }
    return decodedUser;
  } catch (error) {
    localStorage.removeItem("accessToken");
    return redirect("/login");
  }
};

// Definisi Router (dengan perbaikan kecil)
const router = createBrowserRouter([
  // Rute Publik (tidak butuh login)
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/login/success", element: <LoginSuccessPage /> },

  // Rute Terlindungi (butuh login)
  {
    path: "/",
    element: <RoleBasedLayout />,
    loader: checkAuth,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "akun", element: <AkunPage /> },
      { path: "riwayat", element: <RiwayatPage /> },
      { path: "riwayat/:kode_invoice", element: <RiwayatDetailPage /> },
      { path: "kasir", element: <KasirPage /> },
      { path: "proses", element: <ProsesPage /> },
      { path: "pelanggan", element: <PelangganManagementPage /> },
      { path: "layanan", element: <LayananManagementPage /> },
      { path: "users", element: <UserManagementPage /> },
      { path: "cabang", element: <CabangManagementPage /> },
      { path: "laporan-penjualan", element: <LaporanPage /> },
      { path: "pesanan", element: <PesananPage /> },
      { path: "pengaturan-usaha", element: <PengaturanUsahaPage /> },
    ],
  },
]);

// Komponen App baru yang bertugas menunggu Provider siap
function App() {
  const { authState } = useAuth();

  // Selama pengecekan awal berjalan, tampilkan layar loading
  if (!authState.isReady) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900 text-white">
        Memuat aplikasi...
      </div>
    );
  }

  // Setelah siap, baru tampilkan Router
  return <RouterProvider router={router} />;
}

// Struktur Render Final
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="laundry-pos-theme">
        <App />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
