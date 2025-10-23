import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings,
  UserCircle,
  Store,
  FileText,
  PackageSearch,
  BookUser,
  History,
  Building,
} from "lucide-react";

export const menuConfig = [
  // KATEGORI: OPERASIONAL
  {
    key: "operasional",
    label: "OPERASIONAL",
    isHeader: true,
    roles: ["owner", "admin", "kasir"],
  },
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    roles: ["owner", "admin", "kasir"],
  },
  {
    to: "/kasir",
    label: "Kasir",
    icon: <PackageSearch size={18} />,
    roles: ["kasir"],
  },
  {
    to: "/proses",
    label: "Proses Cucian",
    icon: <Settings size={18} />,
    roles: ["kasir"],
  },

  {
    to: "/laundry-hotel",
    label: "Input Laundry Hotel", // Atau 'Entri Hotel'
    icon: <ClipboardList size={18} />, // Ganti ikon kalau mau
    roles: ["kasir"], // Hanya Kasir
  },

  // KATEGORI: MANAJEMEN
  {
    key: "manajemen",
    label: "MANAJEMEN",
    isHeader: true,
    roles: ["owner", "admin", "kasir"],
  },
  {
    to: "/pesanan",
    label: "Manajemen Pesanan",
    icon: <ClipboardList size={18} />,
    roles: ["owner", "admin"],
  },
  {
    to: "/pelanggan",
    label: "Manajemen Pelanggan",
    icon: <BookUser size={18} />,
    roles: ["owner", "admin", "kasir"],
  },
  {
    to: "/layanan",
    label: "Manajemen Layanan",
    icon: <Settings size={18} />,
    roles: ["owner", "admin"],
  },
  {
    to: "/users",
    label: "Manajemen Staff",
    icon: <Users size={18} />,
    roles: ["owner", "admin"],
  },
  {
    to: "/cabang",
    label: "Manajemen Cabang",
    icon: <Store size={18} />,
    roles: ["owner"],
  },

  {
    to: "/riwayat",
    label: "Riwayat Transaksi",
    icon: <History size={18} />,
    roles: ["kasir"],
  },
  // KATEGORI: ANALITIK
  {
    key: "analitik",
    label: "ANALITIK",
    isHeader: true,
    roles: ["owner", "admin"],
  },
  {
    to: "/laporan-penjualan",
    label: "Laporan Penjualan",
    icon: <FileText size={18} />,
    roles: ["owner", "admin"],
  },
  { key: "pengaturan", label: "PENGATURAN", isHeader: true, roles: ["owner"] },
  {
    to: "/pengaturan-usaha",
    label: "Profil Usaha",
    icon: <Building size={18} />,
    roles: ["owner"],
  },

  // "Pengaturan Akun" dihapus dari sini
];
