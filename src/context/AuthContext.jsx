// src/context/AuthContext.jsx

import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { jwtDecode } from "jwt-decode";
import api from "@/api/axiosInstance";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    token: null,
    user: null,
    pengaturan: null, // <-- State untuk pengaturan
    isReady: false,
  });

  // Efek ini hanya jalan sekali saat aplikasi pertama dimuat
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const user = jwtDecode(token);
          if (user.exp * 1000 > Date.now()) {
            // Jika token valid, pasang di header API dan ambil pengaturan
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            const pengaturanResponse = await api.get("/pengaturan");
            setAuthState({
              token,
              user,
              pengaturan: pengaturanResponse.data,
              isReady: true,
            });
          } else {
            // Token kadaluarsa
            localStorage.removeItem("accessToken");
            setAuthState({
              token: null,
              user: null,
              pengaturan: null,
              isReady: true,
            });
          }
        } catch (error) {
          console.error("Inisialisasi auth gagal:", error);
          localStorage.removeItem("accessToken");
          setAuthState({
            token: null,
            user: null,
            pengaturan: null,
            isReady: true,
          });
        }
      } else {
        // Tidak ada token
        setAuthState({
          token: null,
          user: null,
          pengaturan: null,
          isReady: true,
        });
      }
    };
    initializeAuth();
  }, []);

  // [FIX UTAMA] Buat fungsi login menjadi async
  const login = useCallback(async (accessToken) => {
    localStorage.setItem("accessToken", accessToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    const user = jwtDecode(accessToken);
    try {
      // Tunggu sampai data pengaturan selesai diambil
      const pengaturanResponse = await api.get("/pengaturan");
      // Baru setelah itu update state
      setAuthState({
        token: accessToken,
        user,
        pengaturan: pengaturanResponse.data,
        isReady: true,
      });
    } catch (error) {
      console.error("Gagal memuat pengaturan setelah login:", error);
      // Jika gagal, tetap loginkan user tapi pengaturan null
      setAuthState({
        token: accessToken,
        user,
        pengaturan: null,
        isReady: true,
      });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/pengguna/logout");
    } catch (error) {
      console.error("Gagal saat mencoba logout dari server:", error);
    } finally {
      localStorage.removeItem("accessToken");
      delete api.defaults.headers.common["Authorization"];
      setAuthState({
        token: null,
        user: null,
        pengaturan: null,
        isReady: true,
      });
    }
  }, []);

  const value = { authState, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
}
