import React from "react";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "./AdminLayout";
import KasirLayout from "./KasirLayout";
// BENAR
import { Navigate } from "react-router-dom";

function RoleBasedLayout() {
  const { authState } = useAuth();

  // Logika sekarang jauh lebih sederhana.
  // AuthContext adalah satu-satunya sumber kebenaran.

  // 1. Jika context masih loading (misal: saat refresh), tampilkan loading.
  // Pengecekan `token` memastikan kita tidak langsung redirect sebelum context siap.
  if (!authState.token) {
    // Jika setelah loading selesai token tetap null, berarti user tidak login.
    // AuthContext dan loader router akan menangani redirect, tapi ini sebagai fallback.
    
    return <Navigate to="/login" replace />;
  }

  // 2. Jika user belum termuat tapi token ada, tampilkan loading.
  if (!authState.user) {
    return (
      <div className="bg-slate-800 min-h-screen text-white flex justify-center items-center">
        <p>Memuat data pengguna...</p>
      </div>
    );
  }

  // 3. Jika user sudah ada, tampilkan layout yang sesuai.
  if (authState.user.role === "owner" || authState.user.role === "admin") {
    return <AdminLayout />;
  }

  if (authState.user.role === "kasir") {
    return <KasirLayout />;
  }

  // Fallback jika role tidak valid
  return <div>Peran tidak valid.</div>;
}

export default RoleBasedLayout;
