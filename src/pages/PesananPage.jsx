// src/pages/PesananPage.jsx (VERSI FINAL & ANTI-BOCOR)

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { usePageVisibility } from "@/lib/usePageVisibility.js";

// Impor komponen
import { Button } from "@/components/ui/Button.jsx";
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
import { Loader2 } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState.jsx";
import { ClipboardList } from "lucide-react";

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
    process_status: "", // Nama kolom asli
    branch_id: "", // Nama kolom asli
  });
  const [cabangs, setCabangs] = useState([]);

  // Ambil data cabang (sudah pake Supabase)
  useEffect(() => {
    if (authState.role === "owner" && authState.business_id) {
      const fetchCabangsForOwner = async () => {
        const { data, error } = await supabase
          .from("branches")
          .select("id, name")
          .eq("business_id", authState.business_id);
        if (error) toast.error("Gagal memuat daftar cabang.");
        else setCabangs(data || []);
      };
      fetchCabangsForOwner();
    }
  }, [authState.role, authState.business_id]);

  // "Mesin" Fetch Data (manggil "Koki" RPC)
  const fetchPesanan = useCallback(async () => {
    if (!authState.business_id) return;

    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.rpc("get_all_orders", {
        p_business_id: authState.business_id,
        p_role: authState.role,
        p_branch_id: authState.branch_id,
        p_search_term: filters.search,
        p_start_date: filters.startDate || "",
        p_end_date: filters.endDate || "",
        p_process_status: filters.process_status,
        p_branch_filter: filters.branch_id ? parseInt(filters.branch_id) : null,
      });

      if (error) throw error;
      setTransaksis(data || []);
    } catch (err) {
      setError("Gagal mengambil data pesanan. " + err.message);
      setTransaksis([]);
    } finally {
      setLoading(false);
    }
  }, [filters, authState.business_id, authState.role, authState.branch_id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPesanan();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchPesanan]);

  usePageVisibility(fetchPesanan); // Pasang sensor anti-macet

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
            value={filters.process_status || "all"}
            onValueChange={(value) =>
              handleSelectFilterChange("process_status", value)
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
              <SelectItem value="Proses Pengantaran">
                Proses Pengantaran
              </SelectItem>
              <SelectItem value="Selesai">Selesai</SelectItem>
              <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
          {authState.role === "owner" && (
            <Select
              value={filters.branch_id || "all"}
              onValueChange={(value) =>
                handleSelectFilterChange("branch_id", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua Cabang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Cabang</SelectItem>
                {cabangs?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
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
                  {authState.role === "owner" && <TableHead>Cabang</TableHead>}
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
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
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
                        {tx.invoice_code}
                      </TableCell>
                      {authState.role === "owner" && (
                        <TableCell>{tx.branches?.name || "N/A"}</TableCell>
                      )}
                      <TableCell className="font-medium text-primary">
                        {tx.customers?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {new Date(tx.created_at).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {tx.grand_total.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.payment_status === "Lunas"
                              ? "success"
                              : "warning"
                          }
                        >
                          {tx.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{tx.process_status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/riwayat/${tx.invoice_code}`)
                          }
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center">
                      <EmptyState
                        icon={<ClipboardList className="h-16 w-16" />}
                        title="Tidak Ada Pesanan"
                        description="Tidak ada pesanan yang cocok dengan filter pencarian Anda."
                      />
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
