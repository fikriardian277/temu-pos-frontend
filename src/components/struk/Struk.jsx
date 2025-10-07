import React from "react";

const Struk = React.forwardRef(({ transaksi }, ref) => {
  if (!transaksi) return null;

  const formatRupiah = (value) => Number(value ?? 0).toLocaleString("id-ID");

  return (
    <div
      ref={ref}
      className="bg-white text-black font-mono text-[10px] w-[220px] mx-auto p-1 leading-tight"
    >
      <style>{`
        @page {
          size: 58mm auto;
          margin: 0;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Header */}
      <div className="text-center mb-1">
        <h1 className="font-bold text-[12px] uppercase">
          {transaksi.Usaha?.nama_usaha || "Nama Usaha"}
        </h1>
        <p className="text-[9px] leading-tight">
          {transaksi.Cabang?.alamat_cabang || "Alamat Cabang"}
        </p>
        <p className="text-[9px] leading-tight">
          Telp: {transaksi.Cabang?.nomor_telepon || "-"}
        </p>
      </div>

      <hr className="border-dashed border-t border-black my-1" />

      {/* Info transaksi */}
      <div className="space-y-[2px]">
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
          <span>{transaksi.Pengguna?.nama_lengkap || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span>Pelanggan:</span>
          <span>{transaksi.Pelanggan?.nama || "-"}</span>
        </div>
      </div>

      <hr className="border-dashed border-t border-black my-1" />

      {/* Detail item */}
      {transaksi.Pakets?.map((paket) => (
        <div key={paket.id} className="mb-[3px]">
          <p className="font-semibold">{paket.nama_paket}</p>
          <div className="flex justify-between">
            <span>
              {paket.DetailTransaksi.jumlah} {paket.satuan} × Rp
              {formatRupiah(paket.harga)}
            </span>
            <span>Rp{formatRupiah(paket.DetailTransaksi.subtotal)}</span>
          </div>
        </div>
      ))}

      <hr className="border-dashed border-t border-black my-1" />

      {/* Subtotal dan total */}
      <div className="space-y-[2px]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rp{formatRupiah(transaksi.subtotal)}</span>
        </div>
        {transaksi.diskon > 0 && (
          <div className="flex justify-between">
            <span>Diskon</span>
            <span>-Rp{formatRupiah(transaksi.diskon)}</span>
          </div>
        )}
        {transaksi.biaya_layanan > 0 && (
          <div className="flex justify-between">
            <span>Layanan</span>
            <span>Rp{formatRupiah(transaksi.biaya_layanan)}</span>
          </div>
        )}
      </div>

      <hr className="border-dashed border-t border-black my-1" />

      {/* Grand total */}
      <div className="flex justify-between font-bold text-[11px]">
        <span>GRAND TOTAL</span>
        <span>Rp{formatRupiah(transaksi.grand_total)}</span>
      </div>

      <p className="text-center mt-2 text-[9px] italic">
        {transaksi.Usaha?.struk_footer_text || "Terima Kasih!"}
      </p>
    </div>
  );
});

export default Struk;
