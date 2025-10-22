// src/main.jsx (VERSI OPERASI NUKLIR)

import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "@/components/ui/Sonner.jsx";
import { supabase } from "./supabaseClient";
import App from "./App"; // Kita butuh App.jsx terpisah

import "antd/dist/reset.css";
import "./index.css";

console.log("CCTV MAIN: Memulai file main.jsx...");

// INILAH OPERASI NUKLIRNYA
// Kita paksa JavaScript untuk berhenti dan menunggu jawaban dari Supabase
// SEBELUM React mulai render.
const {
  data: { session },
} = await supabase.auth.getSession();

console.log(
  "CCTV MAIN: Jawaban dari getSession diterima.",
  session ? `Ada sesi untuk ${session.user.id}` : "Tidak ada sesi."
);

// Setelah dapat jawaban, baru kita render aplikasi
ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider initialSession={session}>
    {" "}
    {/* Kirim sesi awal sebagai properti */}
    <ThemeProvider defaultTheme="light" storageKey="laundry-pos-theme">
      <App />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  </AuthProvider>
);
