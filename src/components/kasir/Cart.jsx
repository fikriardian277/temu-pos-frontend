// src/components/kasir/Cart.jsx

import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Trash2 } from "lucide-react";
import { Separator } from "../ui/separator";
import { Checkbox } from "../ui/checkbox"; // <-- Jangan lupa import Checkbox
import { Label } from "../ui/label"; // <-- Jangan lupa import Label

function Cart({
  cart,
  onRemoveFromCart,
  onProsesTransaksi,
  isProcessing,
  subtotal,
  diskonPoin,
  grandTotal,
  catatan,
  setCatatan,
  statusPembayaran,
  setStatusPembayaran,
  metodePembayaran,
  setMetodePembayaran,
  selectedPelanggan,
  // [BARU] Terima props baru untuk logika dinamis
  isPoinSystemActive,
  isBonusMerchandiseActive,
  merchandiseName,
  bonusMerchandiseDibawa,
  setBonusMerchandiseDibawa,
}) {
  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Detail Transaksi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Keranjang</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-2">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-sm p-2 bg-muted rounded-md"
                  >
                    <div>
                      <p className="font-semibold">{item.nama_paket}</p>
                      <p className="text-muted-foreground">
                        {item.jumlah} {item.satuan} x Rp{" "}
                        {item.harga.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-mono">
                        Rp {item.subtotal.toLocaleString("id-ID")}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onRemoveFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Keranjang masih kosong.
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="catatan">Catatan (Opsional)</Label>
            <Textarea
              id="catatan"
              placeholder="Contoh: Jangan pakai pelembut..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </div>

          {/* [FIX & LOGIC] Checkbox 'totebag' diganti dengan 'merchandise' dinamis */}
          {isPoinSystemActive && isBonusMerchandiseActive && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bonus_merchandise_dibawa"
                checked={bonusMerchandiseDibawa}
                onCheckedChange={setBonusMerchandiseDibawa}
              />
              <Label htmlFor="bonus_merchandise_dibawa">
                Pelanggan bawa {merchandiseName} (Bonus Poin)
              </Label>
            </div>
          )}

          <div>
            <Label>Status Pembayaran</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                variant={statusPembayaran === "Lunas" ? "default" : "outline"}
                onClick={() => setStatusPembayaran("Lunas")}
              >
                Lunas
              </Button>
              <Button
                variant={
                  statusPembayaran === "Belum Lunas" ? "default" : "outline"
                }
                onClick={() => setStatusPembayaran("Belum Lunas")}
              >
                Belum Lunas
              </Button>
            </div>
          </div>

          {statusPembayaran === "Lunas" && (
            <div>
              <Label>Metode Pembayaran</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={metodePembayaran === "Cash" ? "default" : "outline"}
                  onClick={() => setMetodePembayaran("Cash")}
                >
                  Cash
                </Button>
                <Button
                  variant={metodePembayaran === "QRIS" ? "default" : "outline"}
                  onClick={() => setMetodePembayaran("QRIS")}
                >
                  QRIS
                </Button>
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            {diskonPoin > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="text-muted-foreground">Diskon Poin</span>
                <span>- Rp {diskonPoin.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Grand Total</span>
              <span>Rp {grandTotal.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <Button
            onClick={onProsesTransaksi}
            disabled={isProcessing || !selectedPelanggan || cart.length === 0}
            className="w-full"
          >
            {isProcessing ? "Memproses..." : "Proses Transaksi"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default Cart;
