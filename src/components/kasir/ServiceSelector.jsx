// src/components/kasir/ServiceSelector.jsx

import React, { useState, useEffect } from "react";
import api from "../../api/axiosInstance";

// Impor komponen-komponen dari shadcn/ui
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

function ServiceSelector({ onAddToCart }) {
  const [kategoriData, setKategoriData] = useState([]);
  const [loading, setLoading] = useState(true);

  // State tunggal untuk menampung semua pilihan
  const [selection, setSelection] = useState({
    kategoriId: "",
    layananId: "",
    paketId: "",
    jumlah: "",
  });

  useEffect(() => {
    api
      .get("/layanan")
      .then((res) => setKategoriData(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Logika untuk mendapatkan daftar pilihan berdasarkan state
  const layananList =
    kategoriData.find((k) => k.id == selection.kategoriId)?.Layanans || [];
  const paketList =
    layananList.find((l) => l.id == selection.layananId)?.Pakets || [];

  const handleSelectionChange = (name, value) => {
    // Logika reset berantai
    if (name === "kategoriId") {
      setSelection({
        kategoriId: value,
        layananId: "",
        paketId: "",
        jumlah: "",
      });
    } else if (name === "layananId") {
      setSelection((prev) => ({
        ...prev,
        layananId: value,
        paketId: "",
        jumlah: "",
      }));
    } else {
      setSelection((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAdd = () => {
    const paketToAdd = paketList.find((p) => p.id == selection.paketId);
    if (paketToAdd && selection.jumlah > 0) {
      onAddToCart(paketToAdd, parseFloat(selection.jumlah));
      // Reset form ke kondisi awal, kecuali kategori
      setSelection((prev) => ({
        ...prev,
        layananId: "",
        paketId: "",
        jumlah: "",
      }));
    }
  };

  if (loading)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tambah Item</CardTitle>
        </CardHeader>
        <CardContent>Memuat layanan...</CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tambah Item</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Kategori</Label>
            <Select
              value={selection.kategoriId}
              onValueChange={(value) =>
                handleSelectionChange("kategoriId", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="-- Pilih Kategori --" />
              </SelectTrigger>
              <SelectContent>
                {kategoriData.map((k) => (
                  <SelectItem key={k.id} value={String(k.id)}>
                    {k.nama_kategori}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Layanan</Label>
            <Select
              value={selection.layananId}
              onValueChange={(value) =>
                handleSelectionChange("layananId", value)
              }
              disabled={!selection.kategoriId}
            >
              <SelectTrigger>
                <SelectValue placeholder="-- Pilih Layanan --" />
              </SelectTrigger>
              <SelectContent>
                {layananList.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.nama_layanan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Paket</Label>
            <Select
              value={selection.paketId}
              onValueChange={(value) => handleSelectionChange("paketId", value)}
              disabled={!selection.layananId}
            >
              <SelectTrigger>
                <SelectValue placeholder="-- Pilih Paket --" />
              </SelectTrigger>
              <SelectContent>
                {paketList.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nama_paket}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Jumlah</Label>
            <Input
              type="number"
              value={selection.jumlah}
              onChange={(e) => handleSelectionChange("jumlah", e.target.value)}
              min="0"
              placeholder="0"
              disabled={!selection.paketId}
            />
          </div>
        </div>
        <Button
          onClick={handleAdd}
          className="w-full"
          disabled={!selection.paketId || selection.jumlah <= 0}
        >
          + Tambah ke Keranjang
        </Button>
      </CardContent>
    </Card>
  );
}

export default ServiceSelector;
