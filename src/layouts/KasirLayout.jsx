// src/layouts/KasirLayout.jsx

import React from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { menuConfig } from "@/lib/menuConfig.jsx";
import { LogOut, UserCircle, Sun, Moon } from "lucide-react";

// Impor komponen-komponen dari shadcn/ui
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Komponen untuk item navigasi di bottom bar (HP)
const NavItem = ({ to, icon, label, isMainButton = false }) => {
  if (!icon) return null;

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full text-center py-1 transition-colors duration-200 ${
          isMainButton
            ? `h-16 w-16 rounded-full shadow-lg -mt-8 ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border"
              }`
            : `text-xs ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`
        }`
      }
    >
      {React.cloneElement(icon, { size: isMainButton ? 32 : 24 })}
      {!isMainButton && <span className="mt-1">{label}</span>}
    </NavLink>
  );
};

function KasirLayout() {
  const navigate = useNavigate();
  const { authState, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const navItems = menuConfig.filter(
    (item) => !item.isHeader && item.roles.includes("kasir")
  );
  const kasirButton = navItems.find((item) => item.to === "/kasir");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* --- Sidebar untuk Tablet & Desktop --- */}
      <aside className="hidden md:flex md:w-64 bg-card border-r flex-col shadow-lg">
        <div className="p-4 h-16 flex items-center gap-3 border-b">
          <img
            src="/logo.png"
            alt="App Logo"
            className="h-8 w-8 flex-shrink-0"
          />
          <h1 className="text-xl font-bold text-primary whitespace-nowrap">
            POS LAUNDRY
          </h1>
        </div>
        <nav className="flex-grow px-2 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to}>
                  {({ isActive }) => (
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start gap-3"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Button>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-2 mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-start gap-2 p-2 h-auto"
              >
                <UserCircle size={28} />
                <div className="text-left">
                  <p className="text-sm font-semibold">
                    {authState.user?.username}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {authState.user?.role}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="start" side="top">
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
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* --- Konten Utama --- */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        <div className="p-6 lg:p-8 overflow-y-auto flex-grow pb-24 md:pb-6">
          <Outlet />
        </div>
      </main>

      {/* --- Bottom Navigation Bar (HP) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t z-30 grid grid-cols-5 items-center h-16">
        <NavItem
          to="/dashboard"
          icon={navItems.find((i) => i.to === "/dashboard")?.icon}
          label="Dashboard"
        />
        <NavItem
          to="/proses"
          icon={navItems.find((i) => i.to === "/proses")?.icon}
          label="Proses"
        />
        {kasirButton && (
          <NavItem
            to="/kasir"
            icon={kasirButton.icon}
            label="Kasir"
            isMainButton
          />
        )}
        <NavItem
          to="/pelanggan"
          icon={navItems.find((i) => i.to === "/pelanggan")?.icon}
          label="Pelanggan"
        />
        <NavItem to="/akun" icon={<UserCircle />} label="Akun" />
      </nav>
    </div>
  );
}

export default KasirLayout;
