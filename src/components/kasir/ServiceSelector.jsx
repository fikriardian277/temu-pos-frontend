import React, { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select.jsx";
import { Button } from "@/components/ui/Button.jsx";

function ServiceSelector({
  kategoriOptions,
  layananOptions,
  paketOptions,
  onKategoriChange,
  onLayananChange,
  onAddToCart,
}) {
  const [selectedKategori, setSelectedKategori] = useState("");
  const [selectedLayanan, setSelectedLayanan] = useState("");
  const [selectedPaket, setSelectedPaket] = useState("");
  const [jumlah, setJumlah] = useState(0); // <-- DIUBAH DARI 1 MENJADI 0

  const handleKategoriSelect = (kategoriId) => {
    setSelectedKategori(kategoriId);
    setSelectedLayanan("");
    setSelectedPaket("");
    onKategoriChange(kategoriId);
  };

  const handleLayananSelect = (layananId) => {
    setSelectedLayanan(layananId);
    setSelectedPaket("");
    onLayananChange(layananId);
  };

  const handleAddToCartClick = () => {
    if (!selectedPaket || !jumlah) return;
    const paketToAdd = paketOptions.find(
      (p) => p.id === parseInt(selectedPaket)
    );
    if (paketToAdd) {
      onAddToCart(paketToAdd, jumlah);
      setSelectedPaket("");
      setJumlah(0); // <-- DIUBAH DARI 1 MENJADI 0
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pilih Layanan & Paket</CardTitle>
        <CardDescription>
          Pilih kategori, layanan, dan paket yang akan ditambahkan ke keranjang.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropdown Kategori */}
        <div>
          <Label>Kategori</Label>
          <Select onValueChange={handleKategoriSelect} value={selectedKategori}>
            <SelectTrigger>
              <SelectValue placeholder="-- Pilih Kategori --" />
            </SelectTrigger>
            <SelectContent>
              {kategoriOptions?.map((kategori) => (
                <SelectItem key={kategori.id} value={String(kategori.id)}>
                  {kategori.nama_kategori}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dropdown Layanan */}
        <div>
          <Label>Layanan</Label>
          <Select
            onValueChange={handleLayananSelect}
            value={selectedLayanan}
            disabled={!selectedKategori || layananOptions.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="-- Pilih Layanan --" />
            </SelectTrigger>
            <SelectContent>
              {layananOptions?.map((layanan) => (
                <SelectItem key={layanan.id} value={String(layanan.id)}>
                  {layanan.nama_layanan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dropdown Paket & Input Jumlah */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Label>Paket</Label>
            <Select
              onValueChange={setSelectedPaket}
              value={selectedPaket}
              disabled={!selectedLayanan || paketOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="-- Pilih Paket --" />
              </SelectTrigger>
              <SelectContent>
                {paketOptions?.map((paket) => (
                  <SelectItem key={paket.id} value={String(paket.id)}>
                    {paket.nama_paket} - Rp {paket.harga.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Jumlah</Label>
            <Input
              type="number"
              value={jumlah}
              onChange={(e) => setJumlah(parseInt(e.target.value) || 0)}
              onFocus={(e) => e.target.select()} // <-- TAMBAHKAN BARIS INI
              disabled={!selectedPaket}
            />
          </div>
        </div>

        <Button
          onClick={handleAddToCartClick}
          disabled={!selectedPaket || jumlah <= 0} // <-- DIUBAH AGAR MEMVALIDASI JUMLAH > 0
          className="w-full"
        >
          Tambah ke Keranjang
        </Button>
      </CardContent>
    </Card>
  );
}

export default ServiceSelector;
