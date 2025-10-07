// src/components/struk/Struk.jsx

import React from "react";

const Struk = React.forwardRef(({ transaksi }, ref) => {
  if (!transaksi) {
    return null;
  }

  // Helper untuk format Rupiah yang aman dari null/undefined
  const formatRupiah = (value) =>
    Number(value ? value : 0).toLocaleString("id-ID");

  return (
    // [FIX] Beri "penanda" (ref) ke elemen div terluar yang akan kita cetak.
    <div ref={ref} className="bg-white text-black font-mono text-xs w-full p-1">
      <style>{`
        @page { size: 58mm auto; margin: 0; }
        @media print { body { margin: 0; } }
      `}</style>

      <div className="text-center mb-2">
        <h1 className="font-bold text-sm uppercase">
          {transaksi.Usaha?.nama_usaha || "Nama Usaha"}
        </h1>
        <p className="text-[10px] leading-tight">
          {transaksi.Cabang?.alamat_cabang || "Alamat Cabang"}
        </p>
        <p className="text-[10px] leading-tight">
          Telp: {transaksi.Cabang?.nomor_telepon || "-"}
        </p>
      </div>

      <hr className="border-dashed border-black my-1" />

      <div className="flex justify-between">
        <span>Invoice:</span>
        <span>{transaksi.kode_invoice}</span>
      </div>
      <div className="flex justify-between">
        <span>Tanggal:</span>
        <span>
          {new Date(transaksi.createdAt).toLocaleDateString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Kasir:</span>
        <span>{transaksi.Pengguna?.nama_lengkap || "N/A"}</span>
      </div>
      <div className="flex justify-between mb-1">
        <span>Pelanggan:</span>
        <span>{transaksi.Pelanggan?.nama || "N/A"}</span>
      </div>

      <hr className="border-dashed border-black my-1" />

      {transaksi.Pakets?.map((paket) => (
        <div key={paket.id} className="mb-1">
          <p>{paket.nama_paket}</p>
          <div className="flex justify-between">
            <span>
              {paket.DetailTransaksi.jumlah} {paket.satuan} x Rp
              {formatRupiah(paket.harga)}
            </span>
            <span>Rp{formatRupiah(paket.DetailTransaksi.subtotal)}</span>
          </div>
        </div>
      ))}

      <hr className="border-dashed border-black my-1" />

      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>Rp{formatRupiah(transaksi.subtotal)}</span>
      </div>
      {transaksi.diskon > 0 && (
        <div className="flex justify-between">
          <span>Diskon Poin</span>
          <span>- Rp{formatRupiah(transaksi.diskon)}</span>
        </div>
      )}
      {transaksi.biaya_layanan > 0 && (
        <div className="flex justify-between">
          <span>Biaya Layanan</span>
          <span>Rp{formatRupiah(transaksi.biaya_layanan)}</span>
        </div>
      )}

      <hr className="border-dashed border-black my-1" />

      <div className="flex justify-between font-bold">
        <span>GRAND TOTAL</span>
        <span>Rp{formatRupiah(transaksi.grand_total)}</span>
      </div>

      <p className="text-center mt-3 text-[10px] italic">
        {transaksi.Usaha?.struk_footer_text || "Terima Kasih!"}
      </p>
    </div>
  );
});

export default Struk;
