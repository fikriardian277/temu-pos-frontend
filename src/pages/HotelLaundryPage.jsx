// src/pages/HotelLaundryPage.jsx (Bagian Logika Lengkap)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Struk from "../components/struk/Struk"; // <-- TAMBAH INI
import PrintStrukButton from "../components/struk/PrintStrukButton";

// Import komponen UI yang mungkin dibutuhkan (disimpan di sini biar rapi)
import { Button } from "@/components/ui/Button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select.jsx";
import { Input } from "@/components/ui/Input.jsx";
import { Label } from "@/components/ui/Label.jsx";
import { Textarea } from "@/components/ui/Textarea.jsx";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog.jsx";

function HotelLaundryPage() {
  const { authState } = useAuth();
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [hotelCustomers, setHotelCustomers] = useState([]); // State untuk daftar hotel/villa + service_id
  const [selectedHotelId, setSelectedHotelId] = useState(""); // State ID hotel yg dipilih

  const [loadingPackages, setLoadingPackages] = useState(false); // Awalnya false
  const [hotelPackages, setHotelPackages] = useState([]); // State daftar paket hotel (Sprei, Handuk, dll)
  const [quantities, setQuantities] = useState({}); // State { 'paket_id_1': "", 'paket_id_2': "" }
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickupDate, setPickupDate] = useState("");

  const [createdOrderDetails, setCreatedOrderDetails] = useState(null); // <-- State buat nyimpen detail order yg baru dibuat
  const [isStrukModalOpen, setIsStrukModalOpen] = useState(false); // <-- State buat buka/tutup modal struk
  const [isStrukReady, setIsStrukReady] = useState(false); // <-- State kesiapan struk
  const strukRef = useRef(null);

  // --- Fetch HANYA data hotel/villa (customer tipe 'hotel') ---
  useEffect(() => {
    const fetchHotelCustomers = async () => {
      if (!authState.isReady || !authState.business_id) {
        setLoadingHotels(false);
        return;
      }
      setLoadingHotels(true);
      try {
        let customerQuery = supabase
          .from("customers")
          // Ambil ID, nama, DAN default_service_id
          .select("id, name, default_service_id")
          .eq("business_id", authState.business_id)
          .eq("tipe_pelanggan", "hotel")
          .eq("status", "aktif");

        if (authState.role !== "owner" && authState.branch_id) {
          customerQuery = customerQuery.eq("branch_id", authState.branch_id);
        }
        customerQuery = customerQuery.order("name", { ascending: true });

        const { data: customerData, error: customerError } =
          await customerQuery;
        if (customerError) throw customerError;
        setHotelCustomers(customerData || []);
      } catch (error) {
        console.error("Gagal fetch data hotel/villa:", error);
        toast.error("Gagal memuat daftar klien hotel/villa.");
        setHotelCustomers([]);
      } finally {
        setLoadingHotels(false);
      }
    };

    fetchHotelCustomers();
  }, [
    authState.isReady,
    authState.business_id,
    authState.role,
    authState.branch_id,
  ]);

  // --- Fetch paket hotel BERDASARKAN hotel yang dipilih ---
  useEffect(() => {
    const fetchPackagesForSelectedHotel = async () => {
      if (!selectedHotelId || hotelCustomers.length === 0) {
        setHotelPackages([]);
        setQuantities({});
        return;
      }

      setLoadingPackages(true);
      setHotelPackages([]);
      setQuantities({});

      try {
        const selectedCustomer = hotelCustomers.find(
          (customer) => String(customer.id) === selectedHotelId
        );

        if (!selectedCustomer) {
          throw new Error("Data pelanggan hotel tidak ditemukan.");
        }

        const serviceId = selectedCustomer.default_service_id;

        if (!serviceId) {
          toast.warning(
            `Pelanggan "${selectedCustomer.name}" belum terhubung ke Layanan Menu Hotel.`
          );
          setHotelPackages([]);
          return;
        }

        const { data: packageData, error: packageError } = await supabase
          .from("packages")
          .select("*")
          .eq("business_id", authState.business_id)
          .eq("service_id", serviceId)
          .order("name", { ascending: true });

        if (packageError) throw packageError;

        setHotelPackages(packageData || []);

        const initialQuantities = {};
        (packageData || []).forEach((pkg) => {
          initialQuantities[pkg.id] = "";
        });
        setQuantities(initialQuantities);
      } catch (error) {
        console.error("Gagal fetch data paket untuk hotel terpilih:", error);
        toast.error(
          error.message || "Gagal memuat item laundry untuk klien ini."
        );
        setHotelPackages([]);
        setQuantities({});
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchPackagesForSelectedHotel();
  }, [selectedHotelId, hotelCustomers, authState.business_id]); // Trigger saat hotel dipilih

  useEffect(() => {
    setIsStrukReady(false); // Reset dulu
    if (createdOrderDetails && isStrukModalOpen) {
      // Cek kalo ada data DAN modal kebuka
      const timer = setTimeout(() => {
        if (strukRef.current) {
          setIsStrukReady(true);
        } else {
          console.error("ERROR: Ref struk hotel masih kosong.");
        }
      }, 100); // Jeda render
      return () => clearTimeout(timer);
    }
  }, [createdOrderDetails, isStrukModalOpen]);

  // --- Handler untuk ubah jumlah ---
  const handleQuantityChange = (packageId, value) => {
    const numValue = value === "" ? 0 : parseInt(value);
    const sanitizedValue = Math.max(0, isNaN(numValue) ? 0 : numValue);
    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [packageId]: value === "" ? "" : String(sanitizedValue),
    }));
  };

  // --- Handler untuk submit form ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHotelId) {
      toast.error("Silakan pilih klien hotel/villa terlebih dahulu.");
      return;
    }
    const itemsToSubmit = Object.entries(quantities)
      .map(([packageId, quantity]) => ({
        package_id: parseInt(packageId),
        quantity: parseInt(quantity) || 0,
      }))
      .filter((item) => item.quantity > 0);
    if (itemsToSubmit.length === 0) {
      toast.error("Minimal harus ada satu item dengan jumlah lebih dari 0.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: newOrderId, error } = await supabase.rpc(
        "create_hotel_order",
        {
          p_customer_id: parseInt(selectedHotelId),
          p_branch_id: authState.branch_id,
          p_business_id: authState.business_id,
          p_user_id: authState.user.id,
          p_notes: notes,
          p_items: itemsToSubmit,
          p_pickup_date: pickupDate,
        }
      );
      if (error) throw error;

      const { data: orderDetails, error: fetchError } = await supabase
        .from("orders")
        .select(
          `
            *, 
            customers!inner(id, name, tipe_pelanggan, id_identitas_bisnis), 
            branches(id, name, address, phone_number), 
            order_items(*, packages(*))
         `
        )
        .eq("id", newOrderId)
        .eq("business_id", authState.business_id) // Keamanan
        .single();

      if (fetchError) {
        toast.error(
          "Order tercatat, tapi gagal memuat detail struk: " +
            fetchError.message
        );
        // Lanjut reset form meskipun gagal fetch detail
      } else {
        // VVV TAMBAH LOG INI VVV
        console.log("DEBUG Struk Modal - Data Order:", orderDetails);
        console.log(
          "DEBUG Struk Modal - ID Identitas:",
          orderDetails?.customers?.id_identitas_bisnis
        );
        // ^^^ SELESAI ^^^
        setCreatedOrderDetails(orderDetails); // Simpan detailnya
        setIsStrukModalOpen(true); // Buka modal struk
        toast.success("Data laundry hotel berhasil dicatat!");
      }

      toast.success("Data laundry hotel berhasil dicatat!");
      setSelectedHotelId(""); // Reset pilihan hotel
      // Reset quantities (kosongkan semua input)
      const initialQuantities = {};
      hotelPackages.forEach((pkg) => {
        initialQuantities[pkg.id] = "";
      });
      setQuantities(initialQuantities);
      setNotes("");
      setPickupDate("");
    } catch (error) {
      console.error("Gagal submit order hotel:", error);
      toast.error(error.message || "Gagal menyimpan data laundry hotel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render UI ---
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Input Laundry Hotel/Villa</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Klien & Input Jumlah</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* --- Dropdown Pilih Hotel/Villa --- */}
            <div>
              <Label htmlFor="hotel-select">Pilih Klien Hotel/Villa</Label>
              <Select
                value={selectedHotelId}
                onValueChange={setSelectedHotelId}
                disabled={loadingHotels || hotelCustomers.length === 0}
              >
                <SelectTrigger id="hotel-select">
                  <SelectValue
                    placeholder={loadingHotels ? "Memuat..." : "Pilih Klien"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {hotelCustomers.length > 0 ? (
                    hotelCustomers.map((hotel) => (
                      <SelectItem key={hotel.id} value={String(hotel.id)}>
                        {hotel.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="disabled" disabled>
                      {loadingHotels
                        ? "Memuat..."
                        : "Tidak ada klien hotel ditemukan"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pickup-date">Tanggal Pickup</Label>
              <Input
                id="pickup-date"
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                required // <-- Wajib diisi
                // Batasi tanggal maksimal hari ini (opsional)
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* --- Daftar Paket & Input Jumlah --- */}
            <div className="border-t pt-4">
              <Label className="mb-2 block font-medium">
                Input Jumlah Item
              </Label>
              {loadingPackages ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : hotelPackages.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {hotelPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="flex items-center gap-4 p-2 border rounded-md"
                    >
                      <Label
                        htmlFor={`qty-${pkg.id}`}
                        className="flex-1 text-sm"
                      >
                        {pkg.name}
                      </Label>
                      {/* PASTIKAN BAGIAN INI BENAR */}
                      <Input
                        id={`qty-${pkg.id}`}
                        type="number" // Type number bagus, tapi value harus string
                        min="0"
                        placeholder="0"
                        className="w-24"
                        value={quantities[pkg.id] || ""} // Baca dari state
                        onChange={(e) =>
                          handleQuantityChange(pkg.id, e.target.value)
                        } // Panggil handler
                      />
                      <span className="text-sm text-muted-foreground w-10 text-right">
                        {pkg.unit || "pcs"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada item laundry hotel yang terdaftar di kategori "Hotel
                  & Villa".
                </p>
              )}
            </div>

            {/* --- Input Catatan --- */}
            <div>
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* --- Tombol Submit --- */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  loadingPackages ||
                  !selectedHotelId ||
                  hotelPackages.length === 0
                }
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Catat Pengiriman & Buat Struk
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Dialog open={isStrukModalOpen} onOpenChange={setIsStrukModalOpen}>
        <DialogContent className="max-w-xs p-4">
          {" "}
          {/* Ukuran modal kecil */}
          <DialogHeader>
            <DialogTitle>Struk Tercatat</DialogTitle>
            <DialogDescription>
              Invoice: {createdOrderDetails?.invoice_code || "-"}
            </DialogDescription>
          </DialogHeader>
          {createdOrderDetails ? (
            <div className="py-2">
              {/* Tempat Struk (tidak terlihat langsung, hanya untuk print) */}
              <div
                className="absolute -left-[9999px] top-0 print:static print:block"
                aria-hidden="true"
              >
                <div ref={strukRef}>
                  {" "}
                  {/* Pasang ref di sini */}
                  <Struk
                    transaksi={createdOrderDetails}
                    pengaturan={authState.pengaturan}
                  />
                </div>
              </div>
              {/* Preview Struk di Modal (jika mau) */}
              <div className="border rounded-md bg-muted/30 p-1 max-h-80 overflow-y-auto">
                <Struk
                  transaksi={createdOrderDetails}
                  pengaturan={authState.pengaturan}
                />
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Memuat detail struk...
            </p>
          )}
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsStrukModalOpen(false)} // Tombol Tutup
            >
              Tutup
            </Button>
            <PrintStrukButton
              componentRef={strukRef}
              disabled={!isStrukReady || !createdOrderDetails} // Disable jika belum siap
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HotelLaundryPage;
