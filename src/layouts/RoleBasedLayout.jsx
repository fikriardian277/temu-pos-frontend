// src/layouts/RoleBasedLayout.jsx (VERSI SUPER FINAL & BENAR)

import React from "react";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "./AdminLayout";
import KasirLayout from "./KasirLayout";
import { Loader2 } from "lucide-react";

function RoleBasedLayout() {
  const { authState } = useAuth();

  // Kita cek dulu apakah authState (dompetnya) sudah siap
  if (!authState.isReady || !authState.role) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">Memvalidasi peran pengguna...</p>
      </div>
    );
  }

  // TUGAS UTAMA: Cek role dari 'authState', BUKAN 'authState.user'
  if (authState.role === "owner" || authState.role === "admin") {
    return <AdminLayout />;
  }

  if (authState.role === "kasir") {
    return <KasirLayout />;
  }

  // Fallback jika role tidak valid
  return (
    <div className="flex justify-center items-center h-screen">
      <p>Role pengguna tidak valid: {authState.role}</p>
    </div>
  );
}

export default RoleBasedLayout;
