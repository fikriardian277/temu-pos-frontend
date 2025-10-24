// src/components/struk/Struk.jsx (VERSI FINAL HOTEL + TOTAL)

import React, { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";

const Struk = React.forwardRef(({ transaksi, pengaturan }, ref) => {
  const [identityData, setIdentityData] = useState(null);
  const [loadingIdentity, setLoadingIdentity] = useState(false);

  // --- useEffect Fetch Identitas ---
  useEffect(() => {
    console.log("DEBUG Struk - Menerima Transaksi:", transaksi);
    setIdentityData(null);
    setLoadingIdentity(false);
    const isHotelOrder = transaksi?.tipe_order === "hotel";
    const customerData = transaksi?.customers;
    const identityId = customerData?.id_identitas_bisnis;
    const businessId = transaksi?.business_id;

    if (isHotelOrder && identityId && businessId) {
      const fetchIdentity = async () => {
        setLoadingIdentity(true);
        try {
          const { data, error } = await supabase
            .from("identitas_bisnis")
            .select("*")
            .eq("id", identityId)
            .eq("business_id", businessId)
            .maybeSingle(); // Aman jika ID null
          if (error) throw error;
          console.log("Struk Fetch SUKSES, data:", data);
          setIdentityData(data);
        } catch (error) {
          console.error("Gagal fetch identitas bisnis untuk struk:", error);
          setIdentityData(null);
        } finally {
          setLoadingIdentity(false);
        }
      };
      fetchIdentity();
    }
  }, [transaksi]);

  // --- Render Null Jika Transaksi Belum Siap ---
  if (!transaksi) {
    return null;
  }

  // Objek Pengaman & Helper
  const safePengaturan = pengaturan || {};
  const isHotel = transaksi.tipe_order === "hotel"; // Flag
  console.log("DEBUG Struk RENDER - identityData:", identityData);
  const formatRupiah = (value) => Number(value ?? 0).toLocaleString("id-ID");

  const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return "-";
    const options = includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      : { day: "2-digit", month: "long", year: "numeric" }; // DD MMMM YYYY
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-"; // Handle invalid date
      return date.toLocaleDateString("id-ID", options);
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "-";
    }
  };

  return (
    <div
      ref={ref}
      className="bg-white text-black font-mono text-[10px] w-[220px] mx-auto p-1 leading-tight"
    >
      <style>{`
        @page { size: 58mm auto; margin: 0; }
        @media print { body { margin: 0; } }
        .item-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 1px 0; align-items: center; /* Tambah align center */ }
    .item-name { flex-grow: 1; padding-right: 4px; word-break: break-word; }
    .item-qty { width: 30px; /* Perkecil dikit */ text-align: center; flex-shrink: 0; }
    .item-price { width: 55px; /* Lebar kolom harga */ text-align: right; flex-shrink: 0; padding-left: 4px; } /* Kolom harga baru */
        .total-row { display: flex; justify-content: space-between; }
        .signature-box { margin-top: 15px; display: flex; justify-content: space-between; text-align: center; font-size: 9px; }
        .signature-col { width: 45%; }
      `}</style>

      {/* Header (Kondisional) */}
      <div className="text-center mb-1">
        {loadingIdentity ? (
          <p className="text-[9px]">Memuat info...</p>
        ) : (
          <>
            {/* --- BAGIAN LOGO (Hanya muncul jika BUKAN hotel DAN diaktifkan) --- */}
            {!isHotel &&
              safePengaturan.show_header_on_receipt &&
              safePengaturan.show_logo_on_receipt &&
              safePengaturan.logo_url && (
                <img
                  src={safePengaturan.logo_url}
                  alt="Logo Usaha"
                  className="h-10 w-auto mx-auto mb-1"
                />
              )}

            {/* --- BAGIAN TEKS HEADER (Pilih dari identitas atau default) --- */}
            {identityData ? (
              // Teks Header Hotel (Identitas Khusus)
              <>
                <h1 className="font-bold text-[12px] uppercase">
                  {identityData.nama_tampil_struk}
                </h1>
                {identityData.alamat_struk && (
                  <p className="text-[9px] leading-tight">
                    {identityData.alamat_struk}
                  </p>
                )}
                {identityData.telepon_struk && (
                  <p className="text-[9px] leading-tight">
                    Telp: {identityData.telepon_struk}
                  </p>
                )}
              </>
            ) : (
              // Teks Header Default (Reguler ATAU Hotel tanpa identitas khusus)
              safePengaturan.show_header_on_receipt && (
                <>
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
              )
            )}
          </>
        )}
      </div>

      <hr className="border-dashed border-t border-black my-1" />

      {/* Info transaksi (Kondisional) */}
      <div className="space-y-[2px]">
        <div className="total-row">
          <span>Invoice:</span>
          <span>{transaksi.invoice_code}</span>
        </div>
        {isHotel ? (
          <>
            <div className="total-row">
              <span>Pickup:</span>
              <span>{formatDate(transaksi.pickup_date, false)}</span>
            </div>
            <div className="total-row">
              <span>Delivery:</span>
              <span>{formatDate(transaksi.created_at, false)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="total-row">
              <span>Diterima:</span>
              <span>{formatDate(transaksi.created_at, true)}</span>
            </div>
            <div className="total-row">
              <span>Selesai:</span>
              <span>
                {formatDate(transaksi.estimated_completion_date, true)}
              </span>
            </div>
            <div className="total-row">
              <span>Kasir:</span>
              <span>
                {transaksi.user_id
                  ? transaksi.user_id.substring(0, 8) + "..."
                  : "-"}
              </span>
            </div>
          </>
        )}
        <div className="text-center my-1 pt-1 border-t border-dashed border-black">
          <span className="font-bold text-[13px] uppercase">
            {transaksi.customers?.name || "-"}
          </span>
        </div>
      </div>

      <hr className="border-dashed border-t border-black my-1" />

      {/* Detail item (Kondisional) */}
      {isHotel ? (
        // Tampilan Hotel (Tabel)
        <div className="mt-1 mb-1 text-[9px]">
          {/* Header Tabel */}
          <div className="item-row font-semibold">
            <div className="item-name">Nama Item</div>
            <div className="item-qty">Jml</div> {/* Singkat jadi Jml */}
            <div className="item-price">Harga/pcs</div> {/* Header Harga */}
          </div>
          {/* Baris Data */}
          {transaksi.order_items?.map((item) => (
            <div key={item.id} className="item-row">
              <div className="item-name">{item.packages?.name || "N/A"}</div>
              <div className="item-qty">{item.quantity}</div>
              {/* Kolom Harga per Item */}
              <div className="item-price">
                Rp{formatRupiah(item.packages?.price || 0)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Tampilan Reguler (Detail Harga)
        <>
          {transaksi.order_items?.map((item) => (
            <div key={item.id} className="mb-[3px]">
              {/* VVV Tampilkan Nama Layanan (jika ada) - Nama Paket VVV */}
              <p className="font-semibold">
                {item.packages?.services?.name
                  ? `${item.packages.services.name} - `
                  : ""}
                {item.packages?.name || "N/A"}
              </p>
              {/* ^^^ SELESAI ^^^ */}
              <div className="total-row">
                <span>
                  {item.quantity} {item.packages?.unit || "pcs"} ×{" "}
                  {formatRupiah(item.packages?.price || 0)}
                </span>
                <span>Rp{formatRupiah(item.subtotal)}</span>
              </div>
            </div>
          ))}
          {transaksi.membership_fee_paid > 0 && (
            <div className="mb-[3px]">
              <p className="font-semibold">Biaya Upgrade Membership</p>
              <div className="flex justify-between">
                <span>
                  1 pcs × {formatRupiah(transaksi.membership_fee_paid)}
                </span>
                <span>Rp{formatRupiah(transaksi.membership_fee_paid)}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* --- BAGIAN TOTAL (SEKARANG TAMPIL UNTUK SEMUA) --- */}
      <hr className="border-dashed border-t border-black my-1" />
      <div className="space-y-[2px]">
        {/* Subtotal (termasuk membership jika ada) */}
        <div className="total-row">
          <span>Subtotal</span>
          <span>
            Rp
            {formatRupiah(
              (transaksi.subtotal || 0) + (transaksi.membership_fee_paid || 0)
            )}
          </span>
        </div>
        {/* Biaya Layanan (jika ada) */}
        {(transaksi.service_fee || 0) > 0 && (
          <div className="total-row">
            <span>Biaya Layanan</span>
            <span>Rp{formatRupiah(transaksi.service_fee)}</span>
          </div>
        )}
        {/* Diskon Poin (hanya jika reguler dan ada diskon) */}
        {!isHotel && (transaksi.discount_amount || 0) > 0 && (
          <div className="total-row">
            <span>Diskon Poin</span>
            <span>-Rp{formatRupiah(transaksi.discount_amount)}</span>
          </div>
        )}
      </div>

      <hr className="border-dashed border-t border-black my-1" />
      {/* Grand total (Tampil untuk semua) */}
      <div className="total-row font-bold text-[11px]">
        <span>GRAND TOTAL</span>
        <span>Rp{formatRupiah(transaksi.grand_total)}</span>
      </div>
      {/* --- AKHIR BAGIAN TOTAL --- */}

      {/* Info Poin (Hanya Reguler) */}
      {!isHotel && safePengaturan.points_scheme !== "nonaktif" && (
        <div className="mt-2 pt-1 border-t border-dashed border-black text-center text-[9px]">
          <p className="font-bold mb-[2px]">-- Info Poin --</p>
          <div className="total-row">
            <span>Poin Ditukar:</span>
            <span>-{transaksi.points_redeemed || 0}</span>
          </div>
          <div className="total-row">
            <span>Poin Didapat:</span>
            <span>+{transaksi.points_earned || 0}</span>
          </div>
          <div className="total-row font-bold mt-1">
            <span>Total Poin Sekarang:</span>
            <span>{transaksi.customers?.points || 0}</span>
          </div>
        </div>
      )}

      {/* Catatan (Tetap Tampil) */}
      {transaksi.notes && (
        <div className="mt-2 pt-1 border-t border-dashed border-black">
          <p className="font-bold">Catatan:</p>
          <p className="text-[9px]">{transaksi.notes}</p>
        </div>
      )}

      {/* Status Bayar (Hanya Reguler) & Footer (Hanya Reguler) */}
      {!isHotel && (
        <div className="mt-2 pt-1 border-t border-dashed border-black text-center">
          <p>
            Status: {transaksi.payment_status} (
            {transaksi.payment_method || "-"})
          </p>
          <p className="mt-2 text-[9px] italic">
            {identityData?.footer_struk ||
              safePengaturan.receipt_footer_text ||
              "Terima Kasih!"}
          </p>
        </div>
      )}

      {/* Tempat TTD (Hanya Hotel) */}
      {isHotel && (
        <div className="signature-box">
          {" "}
          {/* Pakai class dari <style> */}
          <div className="signature-col">
            <p>Pengirim,</p>
            <br />
            <br />
            <p>(.....................)</p>
          </div>
          <div className="signature-col">
            <p>Penerima,</p>
            <br />
            <br />
            <p>(.....................)</p>
          </div>
        </div>
      )}
    </div>
  );
});

export default Struk;
