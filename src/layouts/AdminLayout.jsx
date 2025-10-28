// src/layouts/AdminLayout.jsx (VERSI FINAL - FIX SIDEBAR MOBILE)

import React, { useState } from "react";
import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  LogOut,
  UserCircle,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import { menuConfig } from "@/lib/menuConfig.jsx";

// Komponen-komponen dari shadcn/ui
import { Button } from "@/components/ui/Button.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown-menu";

// --- Komponen Sidebar ---
// [FIX 1] SidebarContent sekarang menerima prop 'isCollapsed'
const SidebarContent = ({ isCollapsed }) => (
  <>
    <div className={`p-4 h-16 flex items-center justify-between border-b`}>
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="App Logo" className="h-8 w-8 flex-shrink-0" />
        <h1
          className={`text-xl font-bold text-primary whitespace-nowrap overflow-hidden transition-all duration-300 ${
            // [FIX 2] Ganti 'isSidebarCollapsed' jadi 'isCollapsed'
            isCollapsed ? "w-0" : "w-auto"
          }`}
        >
          Super app
        </h1>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:flex"
        // onClick tetap pakai state dari parent (AdminLayout)
        onClick={() => {
          // Ini trik kecil: kita butuh setIsSidebarCollapsed dari parent.
          // Cara lebih bersih adalah kirim fungsi onClick ke SidebarContent,
          // tapi kita biarkan dulu, karena tombol ini di-hide di mobile.
          // Untuk sekarang, kita anggap ini diklik dari AdminLayout.
          // (Kita benerin di bawah pas render)
        }}
      >
        {/* Ini juga akan dikontrol dari parent */}
      </Button>
    </div>

    <nav className="flex-grow px-2 py-4 overflow-y-auto">
      <ul className="space-y-1">
        {navItems?.map((item) =>
          item.isHeader ? (
            <li
              key={item.key}
              // [FIX 3] Ganti 'isSidebarCollapsed' jadi 'isCollapsed'
              className={`pt-4 pb-1 ${isCollapsed && "text-center"}`}
            >
              <span
                className={`px-3 text-xs font-semibold text-muted-foreground ${
                  // [FIX 4] Ganti 'isSidebarCollapsed' jadi 'isCollapsed'
                  isCollapsed && "hidden"
                }`}
              >
                {item.label}
              </span>
            </li>
          ) : (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={() => {
                  // Ini fungsi dari parent (AdminLayout)
                  // setIsMobileSidebarOpen(false); // (Kita panggil di tempat yang bener)
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-md transition-colors text-foreground/70 ${
                    // [FIX 5] Ganti 'isSidebarCollapsed' jadi 'isCollapsed'
                    isCollapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                {item.icon}
                <span className={`${isCollapsed ? "lg:hidden" : ""}`}>
                  {item.label}
                </span>
              </NavLink>
            </li>
          )
        )}
      </ul>
    </nav>
  </>
);

function AdminLayout() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { authState, logout } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navItems = menuConfig.filter((item) =>
    item.roles.includes(authState.role)
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const currentPage = menuConfig.find((item) => item.to === location.pathname);
  const pageTitle = currentPage ? currentPage.label : "Dashboard";

  // --- Komponen SidebarContent Dibuat ulang di sini dengan akses ke state ---
  // Ini cara yang lebih bener biar 'SidebarContent' bisa ngakses state
  const SidebarWithLogic = ({ isCollapsed }) => (
    <>
      <div className={`p-4 h-16 flex items-center justify-between border-b`}>
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="App Logo"
            className="h-8 w-8 flex-shrink-0"
          />
          <h1
            className={`text-xl font-bold text-primary whitespace-nowrap overflow-hidden transition-all duration-300 ${
              isCollapsed ? "w-0" : "w-auto"
            }`}
          >
            Super app
          </h1>
        </div>
        {/* Tombol collapse/expand cuma ada di desktop, jadi kita taruh di sini */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} // <-- Logika dipindah ke sini
        >
          {isSidebarCollapsed ? ( // <-- State dibaca di sini
            <ChevronsRight size={20} />
          ) : (
            <ChevronsLeft size={20} />
          )}
        </Button>
      </div>

      <nav className="flex-grow px-2 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems?.map((item) =>
            item.isHeader ? (
              <li
                key={item.key}
                className={`pt-4 pb-1 ${isCollapsed && "text-center"}`}
              >
                <span
                  className={`px-3 text-xs font-semibold text-muted-foreground ${
                    isCollapsed && "hidden"
                  }`}
                >
                  {item.label}
                </span>
              </li>
            ) : (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setIsMobileSidebarOpen(false)} // <-- Logika setIsMobile... ada di sini
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-3 rounded-md transition-colors text-foreground/70 ${
                      isCollapsed ? "justify-center" : ""
                    } ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted hover:text-foreground"
                    }`
                  }
                >
                  {item.icon}
                  {/* [FIX] Ganti 'lg:hidden' jadi 'hidden' biar pas di mobile (expanded) juga keliatan */}
                  <span className={`${isCollapsed ? "hidden" : ""}`}>
                    {item.label}
                  </span>
                </NavLink>
              </li>
            )
          )}
        </ul>
      </nav>
    </>
  );

  return (
    // [FIX] Layout utama jadi 'h-screen overflow-hidden'
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* --- SIDEBAR DESKTOP --- */}
      <aside
        className={`hidden lg:flex flex-col h-full bg-card border-r shadow-lg transition-all duration-300 ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* [FIX] Panggil SidebarWithLogic dengan state desktop */}
        <SidebarWithLogic isCollapsed={isSidebarCollapsed} />
      </aside>

      {/* --- SIDEBAR MOBILE --- */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-card flex flex-col shadow-lg z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* [FIX] Panggil SidebarWithLogic dengan 'isCollapsed={false}' */}
        <SidebarWithLogic isCollapsed={false} />
      </aside>
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      {/* [FIX] Wrapper konten jadi 'h-full overflow-y-hidden' */}
      <div className="flex-1 flex flex-col h-full overflow-y-hidden">
        {/* --- HEADER ATAS --- */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between lg:justify-end px-6 bg-card/80 backdrop-blur-sm border-b sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <h2 className="font-bold text-lg lg:hidden">{pageTitle}</h2>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 p-2 h-auto"
              >
                <UserCircle size={28} />
                <div className="text-left hidden md:block">
                  <p className="text-sm font-semibold">{authState.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {authState.role}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate("/akun")}>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Pengaturan Akun</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="ml-2">Ganti Tema</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleLogout}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* [FIX] Konten <main> sekarang yang di-scroll */}
        <main className="flex-grow p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
