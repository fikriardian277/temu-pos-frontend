// src/pages/LaporanPage.jsx

import React, { useState, useEffect } from "react";
import api from "../api/axiosInstance";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Impor komponen-komponen dari shadcn/ui
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";

// Komponen kartu statistik ringkas (tidak berubah)
const StatCard = ({ title, value, subtext }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </CardContent>
  </Card>
);

function LaporanPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cabangList, setCabangList] = useState([]);

  // State tunggal untuk semua filter
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    id_cabang: "semua",
  });

  const [chartColors, setChartColors] = useState({
    stroke: "hsl(var(--primary))",
    text: "hsl(var(--foreground))",
  });

  // Efek untuk mengambil warna tema (tidak berubah)
  useEffect(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    setChartColors({
      stroke: `hsl(${rootStyle.getPropertyValue("--primary").trim()})`,
      text: `hsl(${rootStyle.getPropertyValue("--foreground").trim()})`,
    });
  }, []);

  // Efek untuk mengambil daftar cabang (hanya sekali)
  useEffect(() => {
    const fetchCabang = async () => {
      try {
        const res = await api.get("/cabang");
        setCabangList(res.data);
      } catch (error) {
        console.error("Gagal mengambil daftar cabang:", error);
      }
    };
    fetchCabang();
  }, []);

  // Efek untuk mengambil data laporan setiap kali filter berubah
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/laporan/penjualan", { params: filters });
        setReportData(res.data);
      } catch (error) {
        console.error("Gagal fetch laporan:", error);
        // Set data ke null agar menampilkan pesan 'tidak ada data'
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  // Handler untuk mengubah filter tanggal
  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handler untuk mengubah filter cabang
  const handleCabangChange = (value) => {
    setFilters((prev) => ({ ...prev, id_cabang: value }));
  };

  const PIE_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Laporan Penjualan</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
          <CardDescription>
            Pilih rentang tanggal dan cabang untuk melihat laporan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Layout filter diubah jadi 3 kolom */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Tanggal Selesai</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <Label htmlFor="cabang">Cabang</Label>
              <Select
                value={filters.id_cabang}
                onValueChange={handleCabangChange}
              >
                <SelectTrigger id="cabang">
                  <SelectValue placeholder="Pilih Cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Cabang</SelectItem>
                  {cabangList.map((cabang) => (
                    <SelectItem key={cabang.id} value={String(cabang.id)}>
                      {cabang.nama_cabang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-center py-10">Memuat laporan...</p>
      ) : reportData && reportData.summary ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Pendapatan"
              value={`Rp ${reportData.summary.totalRevenue.toLocaleString(
                "id-ID"
              )}`}
            />
            <StatCard
              title="Jumlah Transaksi"
              value={reportData.summary.totalTransactions.toLocaleString(
                "id-ID"
              )}
            />
            <StatCard
              title="Pendapatan Tertinggi"
              value={`Rp ${
                reportData.summary.highestDay?.pendapatan.toLocaleString(
                  "id-ID"
                ) || 0
              }`}
              subtext={reportData.summary.highestDay?.tanggal || "-"}
            />
            <StatCard
              title="Pendapatan Terendah"
              value={`Rp ${
                reportData.summary.lowestDay?.pendapatan.toLocaleString(
                  "id-ID"
                ) || 0
              }`}
              subtext={reportData.summary.lowestDay?.tanggal || "-"}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Grafik Pendapatan Harian</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={reportData.dailyData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="tanggal"
                    stroke={chartColors.text}
                    fontSize={12}
                  />
                  <YAxis
                    stroke={chartColors.text}
                    fontSize={12}
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
                    stroke={chartColors.stroke}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Metode Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={reportData.summary.paymentMethods}
                      dataKey="jumlah"
                      nameKey="metode_pembayaran"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {reportData.summary.paymentMethods.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top 5 Produk & Pelanggan</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Produk Terlaris</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">Terjual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.summary.topProduk.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell>{p.namaPaket}</TableCell>
                          <TableCell className="text-right">
                            {p.jumlah} {p.satuan}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Pelanggan Teraktif</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead className="text-right">Transaksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.summary.topCustomers.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell>{c.namaPelanggan}</TableCell>
                          <TableCell className="text-right">
                            {c.jumlahTransaksi}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <p className="text-center text-muted-foreground py-10">
          Tidak ada data untuk rentang filter yang dipilih.
        </p>
      )}
    </div>
  );
}

export default LaporanPage;
