// src/App.jsx

import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { usePageVisibility } from "./lib/usePageVisibility";

// Impor semua halamanmu
import RoleBasedLayout from "./layouts/RoleBasedLayout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
// ... dan semua import halaman lainnya ...
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
import RiwayatDetailPage from "./pages/RiwayatDetailPage.jsx";
import HotelLaundryPage from "./pages/HotelLaundryPage";
import IdentitasBisnisPage from "./pages/IdentitasBisnisPage";

function ProtectedLayout() {
  const { authState } = useAuth();
  if (!authState.isReady) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  if (!authState.user) {
    return <Navigate to="/login" replace />;
  }
  return <RoleBasedLayout />;
}

function PublicLayout() {
  const { authState } = useAuth();
  if (!authState.isReady) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  if (authState.user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    path: "/",
    element: <ProtectedLayout />,
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
      { path: "laundry-hotel", element: <HotelLaundryPage /> },
      { path: "identitas-bisnis", element: <IdentitasBisnisPage /> },
    ],
  },
]);

function App() {
  // usePageVisibility();
  return <RouterProvider router={router} />;
}

export default App;
