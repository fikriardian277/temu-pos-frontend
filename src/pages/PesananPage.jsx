// src/pages/PesananPage.jsx

import React, { useState, useEffect } from "react";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Impor komponen-komponen dari shadcn/ui
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card.jsx";
import { Input } from "@/components/ui/Input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select.jsx";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/Table.jsx";
import { Badge } from "@/components/ui/Badge.jsx";
import { Button } from "@/components/ui/Button.jsx";

function PesananPage() {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [transaksis, setTransaksis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    startDate: "",
    endDate: "",
    status_proses: "",
    id_cabang_filter: "",
  });
  const [cabangs, setCabangs] = useState([]);

  // Ambil data cabang untuk owner (tidak berubah)
  useEffect(() => {
    if (authState.user?.role === "owner") {
      api.get("/cabang").then((res) => setCabangs(res.data));
    }
  }, [authState.user?.role]);

  // [FIX] useEffect utama sekarang yang bertanggung jawab penuh
  useEffect(() => {
    // Fungsi fetchPesanan didefinisikan di dalam useEffect
    const fetchPesanan = async () => {
      setLoading(true);
      setError(""); // Reset error setiap kali fetch baru
      try {
        const activeFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        );

        // Kirim 'params' langsung ke Axios, lebih bersih
        const response = await api.get("/transaksi", { params: activeFilters });
        setTransaksis(response.data);
      } catch (err) {
        setError("Gagal mengambil data pesanan.");
        setTransaksis([]); // Kosongkan data jika error
      } finally {
        setLoading(false);
      }
    };

    // Debounce tetap di sini
    const timer = setTimeout(() => {
      fetchPesanan();
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [filters]); // <-- Hanya bergantung pada state 'filters'

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value === "all" ? "" : value }));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manajemen Pesanan</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Pencarian</CardTitle>
          <CardDescription>
            Gunakan filter di bawah untuk mencari pesanan spesifik.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Cari Invoice / Nama Pelanggan..."
          />
          <Input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
          <Input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
          <Select
            value={filters.status_proses || "all"}
            onValueChange={(value) =>
              handleSelectFilterChange("status_proses", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Status Proses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status Proses</SelectItem>
              <SelectItem value="Diterima">Diterima</SelectItem>
              <SelectItem value="Proses Cuci">Proses Cuci</SelectItem>
              <SelectItem value="Siap Diambil">Siap Diambil</SelectItem>
              <SelectItem value="Selesai">Selesai</SelectItem>
            </SelectContent>
          </Select>
          {authState.user?.role === "owner" && (
            <Select
              value={filters.id_cabang_filter || "all"}
              onValueChange={(value) =>
                handleSelectFilterChange("id_cabang_filter", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua Cabang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Cabang</SelectItem>
                {cabangs.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nama_cabang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  {authState.user?.role === "owner" && (
                    <TableHead>Cabang</TableHead>
                  )}
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status Bayar</TableHead>
                  <TableHead>Status Proses</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Memuat data pesanan...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-destructive"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : transaksis.length > 0 ? (
                  transaksis.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono font-semibold">
                        {tx.kode_invoice}
                      </TableCell>
                      {authState.user?.role === "owner" && (
                        <TableCell>{tx.Cabang?.nama_cabang || "N/A"}</TableCell>
                      )}
                      <TableCell className="font-medium text-primary">
                        {tx.Pelanggan?.nama || "N/A"}
                      </TableCell>
                      <TableCell>
                        {new Date(tx.createdAt).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {tx.grand_total.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.status_pembayaran === "Lunas"
                              ? "success"
                              : "warning"
                          }
                        >
                          {tx.status_pembayaran}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{tx.status_proses}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/riwayat/${tx.kode_invoice}`)
                          }
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Tidak ada data pesanan yang ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PesananPage;
