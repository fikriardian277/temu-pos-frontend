// src/components/struk/Struk.jsx (VERSI FINAL & LENGKAP 100%)

import React from "react";

const Struk = React.forwardRef(({ transaksi, pengaturan }, ref) => {
  console.log("CCTV STRUK: Menerima 'pengaturan' ini:", pengaturan);
  // Pengecekan Kunci: Hanya butuh 'transaksi' untuk render.
  if (!transaksi) {
    return null; // Jika transaksi belum ada, jangan render apa-apa
  }

  // Buat "objek pengaman"
  const safePengaturan = pengaturan || {};

  const formatRupiah = (value) => Number(value ?? 0).toLocaleString("id-ID");
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  };

  // Kita gunakan subtotal dari database, tapi jika tidak ada, kita hitung manual
  const subtotalItems =
    transaksi.subtotal ||
    transaksi.order_items?.reduce(
      (total, item) => total + (Number(item.subtotal) || 0),
      0
    ) ||
    0;

  return (
    // 'ref' ditempel di elemen paling luar
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
        {safePengaturan.show_header_on_receipt && (
          <>
            {safePengaturan.show_logo_on_receipt && safePengaturan.logo_url && (
              <img
                src={safePengaturan.logo_url}
                alt="Logo"
                className="h-10 w-auto mx-auto mb-1"
              />
            )}
            <h1 className="font-bold text-[12px] uppercase">
              {safePengaturan.business_name || "Nama Usaha"}
            </h1>
            <p className="text-[9px] leading-tight">
              {transaksi.branches?.address || "Alamat Cabang"}
            </p>
            <p className="text-[9px] leading-tight">
              Telp: {transaksi.branches?.phone_number || "-"}
            </p>
          </>
        )}
      </div>

      <hr className="border-dashed border-t border-black my-1" />

      {/* Info transaksi */}
      <div className="space-y-[2px]">
        <div className="flex justify-between">
          <span>Invoice:</span>
          <span>{transaksi.invoice_code}</span>
        </div>
        <div className="flex justify-between">
          <span>Diterima:</span>
          <span>{formatDate(transaksi.created_at)}</span>
        </div>
        {/* TANGGAL SELESAI */}
        <div className="flex justify-between">
          <span>Selesai:</span>
          <span>{formatDate(transaksi.estimated_completion_date)}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir:</span>
          {/* Nanti kita bisa join 'profiles' pake 'user_id' untuk dapet nama */}
          <span>{transaksi.user_id.substring(0, 8)}...</span>
        </div>
        <div className="text-center my-1 pt-1 border-t border-dashed border-black">
          <span className="font-bold text-[13px] uppercase">
            {transaksi.customers?.name || "-"}
          </span>
        </div>
      </div>

      <hr className="border-dashed border-t border-black my-1" />

      {/* Detail item */}
      {transaksi.order_items?.map((item) => (
        <div key={item.id} className="mb-[3px]">
          {/* Kita bisa tambahkan nama layanan/kategori di sini jika perlu */}
          <p className="font-semibold">{item.packages?.name || "Nama Paket"}</p>
          <div className="flex justify-between">
            <span>
              {item.quantity} {item.packages?.unit || "pcs"} ×{" "}
              {formatRupiah(item.packages?.price || 0)}
            </span>
            <span>Rp{formatRupiah(item.subtotal)}</span>
          </div>
        </div>
      ))}

      {/* Tampilkan Biaya Upgrade Membership jika ada */}
      {transaksi.membership_fee_paid > 0 && (
        <div className="mb-[3px]">
          <p className="font-semibold">Biaya Upgrade Membership</p>
          <div className="flex justify-between">
            <span>1 pcs × {formatRupiah(transaksi.membership_fee_paid)}</span>
            <span>Rp{formatRupiah(transaksi.membership_fee_paid)}</span>
          </div>
        </div>
      )}

      <hr className="border-dashed border-t border-black my-1" />

      {/* Subtotal dan total */}
      <div className="space-y-[2px]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          {/* Ambil subtotal (termasuk membership) dari 'orders' */}
          <span>
            Rp
            {formatRupiah(transaksi.subtotal + transaksi.membership_fee_paid)}
          </span>
        </div>
        {/* Tampilkan Biaya Layanan */}
        {transaksi.service_fee > 0 && (
          <div className="flex justify-between">
            <span>Biaya Layanan</span>
            <span>Rp{formatRupiah(transaksi.service_fee)}</span>
          </div>
        )}
        {/* Tampilkan Diskon Poin */}
        {transaksi.discount_amount > 0 && (
          <div className="flex justify-between">
            <span>Diskon Poin</span>
            <span>-Rp{formatRupiah(transaksi.discount_amount)}</span>
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
      {safePengaturan.points_scheme !== "nonaktif" && (
        <div className="mt-2 pt-1 border-t border-dashed border-black text-center text-[9px]">
          <p className="font-bold mb-[2px]">-- Info Poin --</p>
          <div className="flex justify-between">
            <span>Poin Ditukar:</span>
            <span>-{transaksi.points_redeemed}</span>
          </div>
          <div className="flex justify-between">
            <span>Poin Didapat:</span>
            <span>+{transaksi.points_earned}</span>
          </div>
          <div className="flex justify-between font-bold mt-1">
            <span>Total Poin Sekarang:</span>
            <span>{transaksi.customers?.points}</span>
          </div>
        </div>
      )}

      {/* Catatan */}
      {transaksi.notes && (
        <div className="mt-2 pt-1 border-t border-dashed border-black">
          <p className="font-bold">Catatan:</p>
          <p className="text-[9px]">{transaksi.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 pt-1 border-t border-dashed border-black text-center">
        <p>
          Status: {transaksi.payment_status} ({transaksi.payment_method || "-"})
        </p>
        <p className="mt-2 text-[9px] italic">
          {safePengaturan.receipt_footer_text || "Terima Kasih!"}
        </p>
      </div>
    </div>
  );
});

export default Struk;
