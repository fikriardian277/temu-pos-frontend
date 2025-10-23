// src/pages/LaporanPage.jsx

import React, { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient"; // <-- GANTI INI
import { useAuth } from "@/context/AuthContext"; // <-- TAMBAH INI
import { toast } from "sonner";
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

import { Loader2, Download } from "lucide-react";

// Impor komponen-komponen dari shadcn/ui
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card.jsx";
import { Input } from "@/components/ui/Input.jsx";
import { Label } from "@/components/ui/Label.jsx";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/Table.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select.jsx";
import { Button } from "@/components/ui/Button.jsx";

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
  const { authState } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCSV, setLoadingCSV] = useState(false);
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
      if (authState.role !== "owner" || !authState.business_id) return; // Hanya owner yg fetch
      try {
        // VVV GANTI PAKE SUPABASE VVV
        const { data, error } = await supabase
          .from("branches")
          .select("id, name") // Ambil 'name' bukan 'nama_cabang'
          .eq("business_id", authState.business_id)
          .order("name", { ascending: true });

        if (error) throw error;
        setCabangList(data);
        // ^^^ SELESAI ^^^
      } catch (error) {
        console.error("Gagal mengambil daftar cabang:", error);
        toast.error("Gagal mengambil daftar cabang."); // <-- Tambah toast
      }
    };
    // Panggil HANYA jika authState siap
    if (authState.isReady) {
      fetchCabang();
    }
  }, [authState.isReady, authState.role, authState.business_id]);

  // Efek untuk mengambil data laporan setiap kali filter berubah
  useEffect(() => {
    const fetchData = async () => {
      // Jangan fetch jika auth belum siap
      if (!authState.isReady || !authState.business_id) return;

      // Admin hanya bisa lihat cabangnya sendiri
      const targetBranchId =
        authState.role === "admin" && authState.branch_id
          ? authState.branch_id
          : filters.id_cabang === "semua"
          ? null
          : parseInt(filters.id_cabang);

      try {
        setLoading(true);

        // VVV GANTI PAKE RPC VVV
        const { data, error } = await supabase.rpc("get_sales_report_data", {
          p_start_date: filters.startDate,
          p_end_date: filters.endDate,
          p_target_branch_id: targetBranchId,
          p_business_id: authState.business_id,
        });
        // ^^^ SELESAI ^^^

        if (error) throw error;
        setReportData(data);
      } catch (error) {
        console.error("Gagal fetch laporan:", error);
        setReportData(null);
        toast.error("Gagal memuat data laporan."); // <-- Tambah toast
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [
    filters,
    authState.isReady,
    authState.business_id,
    authState.role,
    authState.branch_id,
  ]); // <-- Tambah dependency

  const handleDownloadCSV = () => {
    // Pastikan data laporan sudah ada
    if (!reportData || !reportData.summary || loadingCSV) {
      toast.info("Data laporan belum siap atau sedang dimuat.");
      return;
    }

    setLoadingCSV(true); // Mulai loading

    try {
      const summary = reportData.summary;
      const dailyData = reportData.dailyData; // Data grafik harian

      // Helper escape function (sama seperti sebelumnya)
      const escapeCsvValue = (value) => {
        if (value === null || typeof value === "undefined") return "";
        const stringValue = String(value);
        if (
          stringValue.includes(",") ||
          stringValue.includes('"') ||
          stringValue.includes("\n")
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      // Buat konten CSV baris per baris
      let csvContent = "\ufeff" + "sep=,\n"; // Tambah BOM dan separator hint

      // --- Bagian 1: Info Filter ---
      csvContent += "Filter Laporan\n";
      csvContent += `Tanggal Mulai,${escapeCsvValue(filters.startDate)}\n`;
      csvContent += `Tanggal Selesai,${escapeCsvValue(filters.endDate)}\n`;
      const cabangName =
        filters.id_cabang === "semua"
          ? "Semua Cabang"
          : cabangList.find((c) => String(c.id) === filters.id_cabang)?.name ||
            filters.id_cabang;
      csvContent += `Cabang,${escapeCsvValue(cabangName)}\n\n`;

      // --- Bagian 2: Ringkasan Utama ---
      csvContent += "Ringkasan Utama\n";
      csvContent += "Metrik,Nilai\n"; // Header untuk bagian ini
      csvContent += `Total Pendapatan,Rp ${escapeCsvValue(
        summary.totalRevenue?.toLocaleString("id-ID") || 0
      )}\n`;
      csvContent += `Jumlah Transaksi,${escapeCsvValue(
        summary.totalTransactions || 0
      )}\n`;
      csvContent += `Pendapatan Tertinggi (${
        summary.highestDay?.tanggal || "-"
      }),Rp ${escapeCsvValue(
        summary.highestDay?.pendapatan?.toLocaleString("id-ID") || 0
      )}\n`;
      csvContent += `Pendapatan Terendah (${
        summary.lowestDay?.tanggal || "-"
      }),Rp ${escapeCsvValue(
        summary.lowestDay?.pendapatan?.toLocaleString("id-ID") || 0
      )}\n\n`;

      // --- Bagian 3: Metode Pembayaran ---
      if (summary.paymentMethods && summary.paymentMethods.length > 0) {
        csvContent += "Metode Pembayaran\n";
        csvContent += "Metode,Jumlah Transaksi\n"; // Header
        summary.paymentMethods.forEach((method) => {
          csvContent += `${escapeCsvValue(
            method.metode_pembayaran
          )},${escapeCsvValue(method.jumlah)}\n`;
        });
        csvContent += "\n";
      }

      // --- Bagian 4: Top Produk ---
      if (summary.topProduk && summary.topProduk.length > 0) {
        csvContent += "Top 5 Produk Terlaris\n";
        csvContent += "Nama Paket,Jumlah Terjual,Satuan\n"; // Header
        summary.topProduk.forEach((produk) => {
          csvContent += `${escapeCsvValue(produk.namaPaket)},${escapeCsvValue(
            produk.jumlah
          )},${escapeCsvValue(produk.satuan)}\n`;
        });
        csvContent += "\n";
      }

      // --- Bagian 5: Top Pelanggan ---
      if (summary.topCustomers && summary.topCustomers.length > 0) {
        csvContent += "Top 5 Pelanggan Teraktif\n";
        csvContent += "Nama Pelanggan,Jumlah Transaksi\n"; // Header
        summary.topCustomers.forEach((customer) => {
          csvContent += `${escapeCsvValue(
            customer.namaPelanggan
          )},${escapeCsvValue(customer.jumlahTransaksi)}\n`;
        });
        csvContent += "\n";
      }

      // --- Bagian 6: Data Pendapatan Harian (Opsional, tapi bagus buat grafik) ---
      if (dailyData && dailyData.length > 0) {
        csvContent += "Data Pendapatan Harian\n";
        csvContent += "Tanggal (DD-MM),Pendapatan (Rp)\n"; // Header
        dailyData.forEach((day) => {
          csvContent += `${escapeCsvValue(day.tanggal)},${escapeCsvValue(
            day.pendapatan
          )}\n`;
        });
        csvContent += "\n";
      }

      // --- Buat Blob dan Link Download (Sama seperti sebelumnya) ---
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      const fileName = `Ringkasan_Laporan_${filters.startDate}_sd_${filters.endDate}.csv`; // Ganti nama file
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Gagal download CSV Laporan:", error);
      toast.error(error.message || "Gagal mengunduh ringkasan laporan.");
    } finally {
      setLoadingCSV(false); // Selesai loading
    }
  };

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
            {authState.role === "owner" && (
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
                    {cabangList?.map((cabang) => (
                      <SelectItem key={cabang.id} value={String(cabang.id)}>
                        {/* [FIX] Ganti ke 'name' */}
                        {cabang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleDownloadCSV} // <-- Fungsi yang akan kita buat
              disabled={loading || loadingCSV || !reportData} // <-- Disable saat loading atau data kosong
            >
              {loadingCSV ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3">Memuat laporan...</p>
        </div>
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
                      {reportData.summary.paymentMethods?.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        )
                      )}
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
                      {reportData.summary.topProduk?.map((p, i) => (
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
                      {reportData.summary.topCustomers?.map((c, i) => (
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
