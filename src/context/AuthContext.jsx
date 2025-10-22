// src/context/AuthContext.jsx (VERSI FINAL & STABIL)

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "@/supabaseClient";

const AuthContext = createContext();

// ==========================================================
// INI FUNGSI UTAMA "JANTUNG" APLIKASIMU
// ==========================================================
export function AuthProvider({ children, initialSession }) {
  // 1. State diinisialisasi dengan data awal dari main.jsx
  const [session, setSession] = useState(initialSession || null);
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true); // Mulai dengan loading

  // Fungsi untuk mengambil data user, dibungkus useCallback agar stabil
  const fetchUserData = useCallback(async (currentSession) => {
    try {
      if (!currentSession) {
        setProfile(null);
        setSettings(null);
        return;
      }

      // 1. Ambil profil dulu
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentSession.user.id)
        .single();

      if (profileError) throw profileError;

      // 2. JIKA PROFIL ADA, PAKAI 'profileData' UNTUK CARI PENGATURAN
      let settingsData = null;
      if (profileData && profileData.business_id) {
        const { data, error: settingsError } = await supabase
          .from("settings")
          .select("*")
          .eq("business_id", profileData.business_id) // <-- BENERIN: Pake 'profileData.business_id'
          .maybeSingle();

        if (settingsError) throw settingsError;
        settingsData = data;
      }

      // 3. Baru set state-nya
      setProfile(profileData);
      setSettings(settingsData);
    } catch (error) {
      console.error(
        "Gagal mengambil data profil/settings, logout paksa:",
        error
      );
      await supabase.auth.signOut();
      setProfile(null);
      setSettings(null);
    }
  }, []);

  const refetchAuthData = useCallback(async () => {
    console.log("REFETCH: Mengambil data auth terbaru...");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      await fetchUserData(session);
    }
  }, [fetchUserData]);

  // useEffect ini sekarang punya dua tugas:
  // 1. Mengambil data awal saat komponen pertama kali mount.
  // 2. Mendengarkan perubahan login/logout di masa depan.
  useEffect(() => {
    // Tugas 1: Ambil data awal berdasarkan initialSession
    async function getInitialData() {
      if (initialSession) {
        await fetchUserData(initialSession);
      }
      // Setelah data awal selesai di-load, baru kita matikan loading
      setLoading(false);
    }
    getInitialData();

    // Tugas 2: Siapkan listener untuk login/logout berikutnya
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Listener ini akan menangani saat user klik login atau logout
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // <-- Array kosong berarti ini hanya jalan sekali saat komponen mount

  // Setiap kali sesi berubah (dari listener), kita ambil ulang data profilnya
  useEffect(() => {
    if (session) {
      fetchUserData(session);
    }
  }, [session, fetchUserData]);

  // Objek authState yang akan digunakan di seluruh aplikasi
  const authState = {
    user: session?.user,
    ...profile,
    pengaturan: settings,
    isReady: !loading,
  };

  const logout = () => supabase.auth.signOut();
  const value = { authState, logout, refetchAuthData };

  return (
    <AuthContext.Provider value={value}>
      {/* Kunci anti-blank screen: Jangan render children sampai loading awal selesai */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// ==========================================================
// INI HOOK UNTUK MEMANGGIL "JANTUNG"-NYA
// ==========================================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
}
