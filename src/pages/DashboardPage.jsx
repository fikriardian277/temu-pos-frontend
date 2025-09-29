// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from "react";
import api from "@/api/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import OrderStatusPieChart from "@/components/charts/OrderStatusPieChart";
import { TrendingUp, Building, DollarSign, ListOrdered } from "lucide-react";

// Impor komponen baru dari shadcn/ui
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

// [REBUILD] Komponen StatCard menggunakan komponen Card
const StatCard = ({ title, value, icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

// [REBUILD] Komponen OwnerDashboard
const OwnerDashboard = ({ data }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="Total Revenue"
        value={`Rp ${data.total_revenue.toLocaleString("id-ID")}`}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Total Pesanan"
        value={data.total_orders.toLocaleString("id-ID")}
        icon={<ListOrdered className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Jumlah Cabang Aktif"
        value={data.performance_by_cabang.length}
        icon={<Building className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Performa per Cabang</CardTitle>
        <CardDescription>
          Ringkasan pendapatan dan pesanan untuk setiap cabang.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Cabang</TableHead>
              <TableHead className="text-right">Total Revenue</TableHead>
              <TableHead className="text-right">Total Pesanan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.performance_by_cabang.map((cabang) => (
              <TableRow key={cabang.id_cabang}>
                <TableCell className="font-medium">
                  {cabang["Cabang.nama_cabang"]}
                </TableCell>
                <TableCell className="text-right font-mono">
                  Rp {parseInt(cabang.total_revenue).toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {parseInt(cabang.total_orders).toLocaleString("id-ID")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

// [REBUILD] Komponen BranchDashboard (Admin/Kasir)
const BranchDashboard = ({ data }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Revenue Hari Ini"
        value={`Rp ${data.revenue_today.toLocaleString("id-ID")}`}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Order Hari Ini"
        value={data.orders_today}
        icon={<ListOrdered className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Order Aktif"
        value={data.active_orders}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Siap Diambil"
        value={data.ready_to_pickup}
        icon={<Building className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
    {data.status_counts && (
      <Card>
        <CardHeader>
          <CardTitle>Status Order Aktif</CardTitle>
          <CardDescription>
            Distribusi status untuk semua pesanan yang sedang berjalan.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="max-w-xs">
            <OrderStatusPieChart data={data.status_counts} />
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);

// Fungsi sapaan (tetap sama)
const getGreeting = () => {
  const currentHour = new Date().getHours();

  if (currentHour >= 4 && currentHour < 12) {
    return "Selamat Pagi";
  } else if (currentHour >= 12 && currentHour < 15) {
    return "Selamat Siang";
  } else if (currentHour >= 15 && currentHour < 19) {
    return "Selamat Sore";
  } else {
    return "Selamat Malam";
  }
};

function DashboardPage() {
  const { authState } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authState.user) return;

    const fetchDashboardData = async () => {
      try {
        // [FIX] Tentukan endpoint berdasarkan peran pengguna
        const endpoint =
          authState.user.role === "owner"
            ? "/dashboard/owner-summary"
            : "/dashboard/summary";

        const response = await api.get(endpoint);
        setDashboardData(response.data);
      } catch (err) {
        setError("Gagal mengambil data dashboard.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authState.user]);

  if (loading) return <p className="text-center">Memuat data dashboard...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        {getGreeting()},{" "}
        {authState.user?.nama_lengkap || authState.user?.username}!
      </h1>
      <p className="text-muted-foreground mb-8">
        {" "}
        {/* [FIX] Gunakan warna tema */}
        {authState.user.role === "owner"
          ? "Berikut adalah ringkasan performa seluruh bisnis Anda."
          : "Berikut adalah ringkasan operasional cabang Anda hari ini."}
      </p>

      {dashboardData &&
        (authState.user.role === "owner" ? (
          <OwnerDashboard data={dashboardData} />
        ) : (
          <BranchDashboard data={dashboardData} />
        ))}
    </div>
  );
}

export default DashboardPage;
