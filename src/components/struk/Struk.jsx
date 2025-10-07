// src/components/struk/Struk.jsx

import React from "react";
import { useAuth } from "@/context/AuthContext";

const formatRupiah = (value) => {
  if (value == null) return "0";
  return Number(value).toLocaleString("id-ID");
};

const Struk = ({ transaksi }) => {
  const { authState } = useAuth();
  const { pengaturan } = authState;

  // [LOGIC] Variabel helper untuk mengecek apakah sistem poin aktif
  const isPoinSystemActive = pengaturan?.skema_poin_aktif !== "nonaktif";

  if (!transaksi) {
    return null;
  }

  const {
    kode_invoice,
    createdAt,
    Pelanggan,
    Pakets,
    catatan,
    grand_total,
    poin_digunakan,
    poin_didapat,
    status_pembayaran,
    metode_pembayaran,
  } = transaksi;

  const createdAtStr = createdAt
    ? new Date(createdAt).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const subtotal = Array.isArray(Pakets)
    ? Pakets.reduce(
        (total, item) => total + (item.DetailTransaksi?.subtotal ?? 0),
        0
      )
    : 0;

  return (
    <div
      className="struk"
      style={{
        background: "#fff",
        color: "#000",
        fontFamily: "monospace, 'Courier New', monospace",
        fontSize: 12,
        width: "58mm",
        padding: "6px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @page { size: 58mm auto; margin: 0; }
        @media print { body { margin: 0; } .struk { width: 58mm; } }
      `}</style>

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        {pengaturan?.tampilkan_logo_di_struk && pengaturan?.logo_url && (
          <img
            src={pengaturan.logo_url}
            alt="Logo Usaha"
            style={{
              width: "50%",
              margin: "0 auto 8px auto",
              display: "block",
            }}
          />
        )}
        {pengaturan?.tampilkan_header_di_struk && (
          <>
            <h1
              style={{
                fontWeight: 700,
                fontSize: 16,
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              {pengaturan?.nama_usaha || "Nama Laundry"}
            </h1>
            <p style={{ fontSize: 10, margin: 0 }}>
              {pengaturan?.alamat_usaha}
            </p>
            <p style={{ fontSize: 10, margin: 0 }}>
              {pengaturan?.telepon_usaha}
            </p>
          </>
        )}
      </div>

      <div
        style={{
          textAlign: "center",
          paddingBottom: 6,
          borderBottom: "1px dashed #000",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14 }}>
          {Pelanggan?.nama || "-"}
        </div>
      </div>

      <div style={{ paddingTop: 6, paddingBottom: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Invoice</span>
          <span>{kode_invoice}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Tanggal</span>
          <span>{createdAtStr}</span>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px dashed #000",
          borderBottom: "1px dashed #000",
          padding: "6px 0",
        }}
      >
        {Array.isArray(Pakets) && Pakets.length > 0 ? (
          Pakets?.map((item, idx) => (
            <div key={item?.id ?? idx} style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 600 }}>{`${
                item?.Layanan?.nama_layanan || ""
              } - ${item?.nama_paket || ""}`}</div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                }}
              >
                <div>{`${item?.DetailTransaksi?.jumlah || 0} ${
                  item?.satuan || ""
                } x ${formatRupiah(item?.harga || 0)}`}</div>
                <div>
                  Rp {formatRupiah(item?.DetailTransaksi?.subtotal || 0)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 12 }}>-</div>
        )}
      </div>

      <div
        style={{
          paddingTop: 8,
          paddingBottom: 6,
          borderBottom: "1px dashed #000",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal</span>
          <span>Rp {formatRupiah(subtotal)}</span>
        </div>
        {transaksi.biaya_layanan > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Biaya Layanan</span>
            <span>Rp {formatRupiah(transaksi.biaya_layanan)}</span>
          </div>
        )}
        {poin_digunakan > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Diskon Poin</span>
            <span>
              - Rp{" "}
              {formatRupiah(
                poin_digunakan * (pengaturan?.rupiah_per_poin_redeem || 0)
              )}
            </span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 700,
            marginTop: 4,
          }}
        >
          <span>GRAND TOTAL</span>
          <span>Rp {formatRupiah(grand_total)}</span>
        </div>
      </div>

      {/* [FIX] Tampilkan blok ini HANYA JIKA sistem poin aktif */}
      {isPoinSystemActive && (
        <div
          style={{
            paddingTop: 6,
            paddingBottom: 6,
            borderBottom: "1px dashed #000",
            fontSize: 11,
          }}
        >
          <div
            style={{ fontWeight: 600, marginBottom: 4, textAlign: "center" }}
          >
            -- Info Poin --
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Poin Ditukar</span>
            <span>- {formatRupiah(poin_digunakan)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Poin Didapat</span>
            <span>+ {formatRupiah(poin_didapat)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
              marginTop: 4,
              borderTop: "1px solid #ccc",
              paddingTop: 2,
            }}
          >
            <span>Poin Sekarang</span>
            <span>{formatRupiah(Pelanggan?.poin ?? 0)}</span>
          </div>
        </div>
      )}

      {catatan && (
        <div
          style={{
            paddingTop: 6,
            paddingBottom: 6,
            borderBottom: "1px dashed #000",
            fontSize: 11,
          }}
        >
          <div style={{ fontWeight: 600 }}>Catatan:</div>
          <div>{catatan}</div>
        </div>
      )}

      <div
        style={{
          borderTop: "1px dashed #000",
          marginTop: 8,
          paddingTop: 6,
          textAlign: "center",
          fontSize: 11,
        }}
      >
        <div>
          Status: {status_pembayaran}{" "}
          {status_pembayaran === "Lunas" && metode_pembayaran
            ? `(${metode_pembayaran})`
            : ""}
        </div>
        <div style={{ marginTop: 8, fontStyle: "italic" }}>
          {pengaturan?.struk_footer_text || "Terima kasih!"}
        </div>
      </div>
    </div>
  );
};

export default Struk;
