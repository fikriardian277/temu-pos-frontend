import React from "react";

const Struk = React.forwardRef(({ transaksi }, ref) => {
  if (!transaksi) return null;

  // Helper yang aman untuk format Rupiah
  const formatRupiah = (value) => Number(value ?? 0).toLocaleString("id-ID");

  const isPoinSystemActive = transaksi.Usaha?.skema_poin_aktif !== "nonaktif";

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

      {/* Header Usaha */}
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

      {/* Info Transaksi */}
      <div className="space-y-[2px]">
        <div className="flex justify-between">
          <span>Invoice:</span>
          <span>{transaksi.kode_invoice}</span>
        </div>
        <div className="flex justify-between">
          <span>Tanggal:</span>
          <span>
            {new Date(transaksi.createdAt).toLocaleString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Kasir:</span>
          <span>{transaksi.Pengguna?.nama_lengkap || "-"}</span>
        </div>
      </div>

      <hr className="border-dashed border-t border-black my-1" />

      {/* Nama Pelanggan */}
      <div className="text-center my-1">
        <span className="font-bold text-[13px] uppercase">
          {transaksi.Pelanggan?.nama || "-"}
        </span>
      </div>

      <hr className="border-dashed border-t border-black my-1" />

      {/* Rincian Item */}
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

      {/* Kalkulasi Total */}
      <div className="space-y-[2px]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rp{formatRupiah(transaksi.subtotal)}</span>
        </div>
        {transaksi.diskon > 0 && (
          <div className="flex justify-between">
            <span>Diskon Poin</span>
            <span>-Rp{formatRupiah(transaksi.diskon)}</span>
          </div>
        )}
        {transaksi.biaya_layanan > 0 && (
          <div className="flex justify-between">
            <span>Biaya Layanan</span>
            <span>Rp{formatRupiah(transaksi.biaya_layanan)}</span>
          </div>
        )}
      </div>

      <hr className="border-dashed border-t border-black my-1" />

      {/* Grand Total */}
      <div className="flex justify-between font-bold text-[11px]">
        <span>GRAND TOTAL</span>
        <span>Rp{formatRupiah(transaksi.grand_total)}</span>
      </div>

      <hr className="border-dashed border-t border-black my-1" />

      {/* Info Poin */}
      {isPoinSystemActive && (
        <div className="mt-1">
          <p className="text-center font-semibold mb-1">-- Info Poin --</p>
          <div className="flex justify-between">
            <span>Poin Ditukar:</span>
            <span>- {formatRupiah(transaksi.poin_digunakan)}</span>
          </div>
          <div className="flex justify-between">
            <span>Poin Didapat:</span>
            <span>+ {formatRupiah(transaksi.poin_didapat)}</span>
          </div>
          <hr className="border-dotted border-t border-black my-1" />
          <div className="flex justify-between font-bold">
            <span>Total Poin Anda:</span>
            <span>{formatRupiah(transaksi.Pelanggan?.poin)}</span>
          </div>
          <hr className="border-dashed border-t border-black my-1" />
        </div>
      )}

      {/* Catatan */}
      {transaksi.catatan && (
        <div className="mt-1">
          <p className="font-semibold">Catatan:</p>
          <p>{transaksi.catatan}</p>
          <hr className="border-dashed border-t border-black my-1" />
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-1">
        <p>
          Status: {transaksi.status_pembayaran}{" "}
          {transaksi.metode_pembayaran
            ? `(${transaksi.metode_pembayaran})`
            : ""}
        </p>
        <p className="mt-2 text-[9px] italic">
          {transaksi.Usaha?.struk_footer_text || "Terima Kasih!"}
        </p>
      </div>
    </div>
  );
});

export default Struk;
