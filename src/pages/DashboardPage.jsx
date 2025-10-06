// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from "react";
import api from "@/api/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Impor komponen
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  DollarSign,
  ShoppingCart,
  Users,
  PlusCircle,
} from "lucide-react";

// Komponen kartu statistik (reusable)
const StatCard = ({ title, value, icon, subtext }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </CardContent>
  </Card>
);

// Komponen untuk Tampilan Owner
const OwnerDashboard = ({ data }) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pendapatan Hari Ini"
          value={`Rp ${data.stats.revenueToday.toLocaleString("id-ID")}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Transaksi Hari Ini"
          value={data.stats.transactionsToday}
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Order Aktif"
          value={data.stats.activeOrders}
          icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
          subtext="Order yang belum selesai"
        />
        <StatCard
          title="Pelanggan Baru (Bulan Ini)"
          value={`+${data.stats.newCustomersThisMonth}`}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Tren Pendapatan (7 Hari Terakhir)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={data.dailyRevenue7Days}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="tanggal"
                  stroke="hsl(var(--foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `Rp${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pendapatan"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Transaksi Terbaru</CardTitle>
            <CardDescription>
              5 transaksi terakhir dari semua cabang.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Cabang</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentTransactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    onClick={() => navigate(`/riwayat/${tx.kode_invoice}`)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      {/* [FIX] Tambahkan ?. untuk Pelanggan */}
                      <div className="font-medium">
                        {tx.Pelanggan?.nama || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tx.kode_invoice}
                      </div>
                    </TableCell>
                    {/* [FIX] Tambahkan ?. untuk Cabang */}
                    <TableCell>{tx.Cabang?.nama_cabang || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      Rp {tx.grand_total.toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Komponen untuk Tampilan Kasir/Admin
const KasirDashboard = ({ data }) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Pendapatan Cabang (Hari Ini)"
          value={`Rp ${data.stats.revenueToday.toLocaleString("id-ID")}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Transaksi Cabang (Hari Ini)"
          value={data.stats.transactionsToday}
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Order Aktif di Cabang Ini"
          value={data.stats.activeOrders}
          icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full md:w-auto"
              onClick={() => navigate("/kasir")}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Buat Transaksi Baru
            </Button>
          </CardContent>
        </Card>
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Transaksi Terbaru di Cabang Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentTransactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    onClick={() => navigate(`/riwayat/${tx.kode_invoice}`)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      {/* [FIX] Tambahkan ?. untuk Pelanggan */}
                      <div className="font-medium">
                        {tx.Pelanggan?.nama || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tx.kode_invoice}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tx.status_proses}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      Rp {tx.grand_total.toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { authState } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/dashboard");
        setDashboardData(response.data);
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading || !dashboardData) {
    return <p className="text-center">Memuat dashboard...</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Selamat Datang, {authState.user.nama_lengkap}!
      </h1>
      {dashboardData.role === "owner" ? (
        <OwnerDashboard data={dashboardData} />
      ) : (
        <KasirDashboard data={dashboardData} />
      )}
    </div>
  );
}

export default DashboardPage;
