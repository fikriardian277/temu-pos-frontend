import React from "react";
import { useAuth } from "@/context/AuthContext";

const Struk = React.forwardRef(({ transaksi }, ref) => {
  const { authState } = useAuth();
  const { pengaturan } = authState;

  if (!transaksi) return null;

  const formatRupiah = (value) => Number(value ?? 0).toLocaleString("id-ID");

  const isPoinSystemActive = pengaturan?.skema_poin_aktif !== "nonaktif";

  // Hitung ulang subtotal HANYA dari item paket.
  const subtotalItems =
    transaksi.Pakets?.reduce(
      (total, item) => total + (item.DetailTransaksi?.subtotal ?? 0),
      0
    ) || 0;

  return (
    <div
      ref={ref}
      className="bg-white text-black font-mono text-[10px] w-[220px] mx-auto p-1 leading-tight"
    >
      <style>{`
        @page { size: 58mm auto; margin: 0; }
        @media print { body { margin: 0; } }
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
            {new Date(transaksi.createdAt).toLocaleString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "short",
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Kasir:</span>
          <span>{transaksi.Pengguna?.nama_lengkap || "-"}</span>
        </div>
        <div className="text-center my-1 pt-1 border-t border-dashed border-black">
          <span className="font-bold text-[13px] uppercase">
            {transaksi.Pelanggan?.nama || "-"}
          </span>
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

      {/* Tampilkan Biaya Upgrade Membership jika ada */}
      {transaksi.upgrade_member && transaksi.biaya_membership_upgrade > 0 && (
        <div className="mb-[3px]">
          <p className="font-semibold">Biaya Upgrade Membership</p>
          <div className="flex justify-between">
            <span>
              1 pcs × Rp{formatRupiah(transaksi.biaya_membership_upgrade)}
            </span>
            <span>Rp{formatRupiah(transaksi.biaya_membership_upgrade)}</span>
          </div>
        </div>
      )}

      {/* [FIX] Tampilkan Biaya Upgrade Membership jika ada (SECARA TERPISAH DARI ITEM) */}
      {transaksi.upgrade_member && transaksi.biaya_membership_upgrade > 0 && (
        <div className="mb-[3px]">
          <p className="font-semibold">Biaya Upgrade Membership</p>
          <div className="flex justify-between">
            <span>
              1 pcs × Rp{formatRupiah(transaksi.biaya_membership_upgrade)}
            </span>
            <span>Rp{formatRupiah(transaksi.biaya_membership_upgrade)}</span>
          </div>
        </div>
      )}

      <hr className="border-dashed border-t border-black my-1" />

      {/* Subtotal dan total */}
      <div className="space-y-[2px]">
        {/* [FIX] Gunakan variabel subtotal_transaksi dari backend untuk akurasi */}
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rp{formatRupiah(transaksi.subtotal)}</span>
        </div>

        {/* [FIX] Tampilkan Biaya Layanan Antar/Jemput jika ada */}
        {transaksi.biaya_layanan > 0 && (
          <div className="flex justify-between">
            <span>Biaya Layanan</span>
            <span>Rp{formatRupiah(transaksi.biaya_layanan)}</span>
          </div>
        )}

        {transaksi.diskon > 0 && (
          <div className="flex justify-between">
            <span>Diskon Poin</span>
            <span>-Rp{formatRupiah(transaksi.diskon)}</span>
          </div>
        )}
      </div>

      <hr className="border-dashed border-t border-black my-1" />

      {/* Grand total */}
      <div className="flex justify-between font-bold text-[11px]">
        <span>GRAND TOTAL</span>
        <span>Rp{formatRupiah(transaksi.grand_total)}</span>
      </div>

      {/* Info Poin */}
      {isPoinSystemActive && (
        <div className="mt-2 pt-1 border-t border-dashed border-black text-center text-[9px]">
          <p className="font-bold mb-[2px]">-- Info Poin --</p>
          <div className="flex justify-between">
            <span>Poin Ditukar:</span>
            <span>-{transaksi.poin_digunakan}</span>
          </div>
          <div className="flex justify-between">
            <span>Poin Didapat:</span>
            <span>+{transaksi.poin_didapat}</span>
          </div>
          <div className="flex justify-between font-bold mt-1">
            <span>Poin Sekarang:</span>
            <span>{transaksi.Pelanggan?.poin}</span>
          </div>
        </div>
      )}

      {/* Catatan */}
      {transaksi.catatan && (
        <div className="mt-2 pt-1 border-t border-dashed border-black">
          <p className="font-bold">Catatan:</p>
          <p className="text-[9px]">{transaksi.catatan}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 pt-1 border-t border-dashed border-black text-center">
        <p>
          Status: {transaksi.status_pembayaran} (
          {transaksi.metode_pembayaran || "-"})
        </p>
        <p className="mt-2 text-[9px] italic">
          {transaksi.Usaha?.struk_footer_text || "Terima Kasih!"}
        </p>
      </div>
    </div>
  );
});

export default Struk;
