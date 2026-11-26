document.addEventListener("DOMContentLoaded", function () {
  var CHECKOUT_PHP_URL = "checkout.php";
  var BELI_SEWA_PHP_URL = "beliSewa.php";
  var CART_STORAGE_KEYS = ["cart", "cartItems", "keranjang", "checkoutCart"];

  var params = new URLSearchParams(window.location.search);
  var urlId = params.get("id");
  var urlMode = params.get("mode") === "rent" ? "rent" : "buy";
  var urlUnits = Math.max(1, parseInt(params.get("units"), 10) || 1);
  var urlDays = Math.max(1, parseInt(params.get("days"), 10) || 1);

  // Menyimpan data aktif yang akan dikirim saat Place Order (disinkronkan dari session/URL/item)
  var currentIdKendaraan = urlId || null;
  var activeMode = urlMode;
  var activeUnits = urlUnits;
  var activeDays = urlDays;

  // Format angka menjadi mata uang Rupiah (tanpa desimal)
  function formatRupiah(amount) {
    var num = Math.max(0, Math.round(Number(amount || 0)));
    return "Rp" + num.toLocaleString("id-ID");
  }

  // Ambil nilai opsi metode pembayaran yang sedang dipilih user
  function getSelectedPaymentMethod() {
    var checked = document.querySelector('input[name="payment_method"]:checked');
    return checked ? checked.value : "";
  }

  // Ambil mode item ('rent' atau 'buy') dari parameter atau properti item
  function resolveItemMode(item, mode) {
    var raw =
      mode ||
      (item && (item.mode || item.type || item.tipe_transaksi)) ||
      "buy";
    return String(raw).toLowerCase() === "rent" ? "rent" : "buy";
  }

  // Ambil jumlah unit item (minimal 1)
  function resolveItemUnits(item, units) {
    var raw =
      units !== undefined
        ? units
        : (item &&
            (item.units !== undefined
              ? item.units
              : item.qty !== undefined
                ? item.qty
                : item.jumlah));
    return Math.max(1, parseInt(raw, 10) || 1);
  }

  // Ambil durasi sewa dalam hari
  function resolveItemDays(item, days) {
    var raw =
      days !== undefined
        ? days
        : (item &&
            (item.days !== undefined
              ? item.days
              : item.duration_days));
    return Math.max(1, parseInt(raw, 10) || 1);
  }

  // Hitung total harga item berdasarkan mode (rent: harga_sewa * unit * hari; buy: harga_jual * unit)
  function hitungHargaItem(kendaraan, mode, units, days) {
    var resolvedMode = resolveItemMode(kendaraan, mode);
    var qty = resolveItemUnits(kendaraan, units);
    var durasi = resolvedMode === "rent" ? resolveItemDays(kendaraan, days) : 1;

    if (resolvedMode === "rent") {
      var hargaSewa = Number(
        (kendaraan &&
          (kendaraan.harga_sewa !== undefined
            ? kendaraan.harga_sewa
            : kendaraan.unit_price)) ||
          0
      );
      return hargaSewa * qty * durasi;
    }

    var hargaJual = Number(
      (kendaraan &&
        (kendaraan.harga_jual !== undefined
          ? kendaraan.harga_jual
          : kendaraan.harga_beli !== undefined
            ? kendaraan.harga_beli
            : kendaraan.unit_price)) ||
        0
    );
    return hargaJual * qty;
  }

  // Format label jumlah unit & durasi sewa
  function formatUnitLabel(item, mode, units, days) {
    var resolvedMode = resolveItemMode(item, mode);
    var qty = resolveItemUnits(item, units);
    var durasi = resolveItemDays(item, days);

    if (resolvedMode === "rent") {
      return qty + " unit(s) x " + durasi + " day(s)";
    }
    return qty + " unit(s)";
  }

  // Normalisasi satu item (dari beliSewa.php, keranjang, atau backend) menjadi struktur seragam
  function normalisasiItem(item, fallbackMode, fallbackUnits, fallbackDays) {
    var resolvedMode = resolveItemMode(item, fallbackMode);
    var qty = resolveItemUnits(item, fallbackUnits);
    var durasi = resolvedMode === "rent" ? resolveItemDays(item, fallbackDays) : 1;

    var originParts = [];
    if (item && item.merek) originParts.push(item.merek);
    if (item && item.tahun) originParts.push(item.tahun);

    var computedPrice = hitungHargaItem(item, resolvedMode, qty, durasi);
    var finalPrice =
      computedPrice > 0
        ? computedPrice
        : Number((item && item.price) || 0);

    return {
      id_kendaraan:
        (item && (item.id_kendaraan || item.id)) || urlId || null,
      image: (item && (item.foto || item.image)) || "",
      type: resolvedMode === "rent" ? "RENT" : "BUY",
      mode: resolvedMode,
      units: qty,
      days: durasi,
      duration_days: durasi,
      name: (item && (item.nama || item.name)) || "",
      origin:
        (item && item.origin) || originParts.join(" • "),
      price: finalPrice,
      unit: formatUnitLabel(item, resolvedMode, qty, durasi)
    };
  }

  // Susun objek item checkout dari detail kendaraan
  function buatItemDariKendaraan(kendaraan, mode, units, days) {
    return normalisasiItem(kendaraan, mode, units, days);
  }

  // Ambil daftar item dari keranjang di localStorage jika diperlukan
  function ambilItemDariKeranjangStorage() {
    for (var i = 0; i < CART_STORAGE_KEYS.length; i++) {
      var raw = null;
      try {
        raw = window.localStorage.getItem(CART_STORAGE_KEYS[i]);
      } catch (e) {
        raw = null;
      }
      if (!raw) continue;

      try {
        var parsed = JSON.parse(raw);
        var list = Array.isArray(parsed)
          ? parsed
          : (parsed && Array.isArray(parsed.items) ? parsed.items : []);

        if (list.length > 0) {
          return list.map(function (item) {
            return normalisasiItem(item);
          });
        }
      } catch (err) {
        console.error("Gagal membaca data keranjang dari localStorage:", err);
      }
    }
    return [];
  }

  // Buat elemen DOM kartu untuk satu item di daftar checkout
  function createItemElement(item) {
    var card = document.createElement("div");
    card.className = "checkout-item";

    // Thumbnail gambar kendaraan
    var thumb = document.createElement("div");
    thumb.className = "item-thumb";
    if (item.image) {
      var img = document.createElement("img");
      img.src = item.image;
      img.alt = item.name || "Kendaraan";
      thumb.appendChild(img);
    }

    // Informasi utama item (badge BUY/RENT, nama, dan merek/tahun)
    var info = document.createElement("div");
    info.className = "item-info";

    if (item.type) {
      var badge = document.createElement("span");
      badge.className = "item-badge";
      badge.textContent = item.type;
      info.appendChild(badge);
    }

    var name = document.createElement("div");
    name.className = "item-name";
    name.textContent = item.name || "";

    var origin = document.createElement("div");
    origin.className = "item-origin";
    origin.textContent = item.origin ? "From " + item.origin : "";

    info.appendChild(name);
    info.appendChild(origin);

    // Kotak harga item dan rincian unit/durasi
    var priceBox = document.createElement("div");
    priceBox.className = "item-price-box";

    var price = document.createElement("div");
    price.className = "item-price";
    price.textContent =
      item.price !== undefined && item.price !== null
        ? formatRupiah(item.price)
        : "";

    var unit = document.createElement("div");
    unit.className = "item-unit";
    unit.textContent = item.unit || "";

    priceBox.appendChild(price);
    priceBox.appendChild(unit);

    card.appendChild(thumb);
    card.appendChild(info);
    card.appendChild(priceBox);

    return card;
  }

  // Render seluruh data checkout dan hitung subtotal + grand total langsung di JS
  function renderCheckout(data) {
    if (!data) return;

    // Sinkronkan ID kendaraan serta mode/unit/hari aktif untuk kebutuhan Place Order
    if (data.id_kendaraan !== undefined && data.id_kendaraan !== null) {
      currentIdKendaraan = data.id_kendaraan;
    } else if (
      Array.isArray(data.items) &&
      data.items.length > 0 &&
      data.items[0].id_kendaraan
    ) {
      currentIdKendaraan = data.items[0].id_kendaraan;
    }

    if (data.mode) {
      activeMode = String(data.mode).toLowerCase() === "rent" ? "rent" : "buy";
    }
    if (data.units !== undefined && data.units !== null) {
      activeUnits = Math.max(1, parseInt(data.units, 10) || 1);
    }
    if (data.days !== undefined || data.duration_days !== undefined) {
      activeDays = Math.max(
        1,
        parseInt(data.days !== undefined ? data.days : data.duration_days, 10) || 1
      );
    }

    // Tampilkan data penerima dan alamat pengiriman jika tersedia
    var nameEl = document.getElementById("recipientName");
    var addressEl = document.getElementById("recipientAddress");
    var recipientName = data.recipient_name || data.nama_penerima || "";
    var alamatPengiriman =
      data.alamat_pengiriman ||
      data.recipient_address ||
      data.alamat_penerima ||
      "";

    if (nameEl) {
      nameEl.textContent = recipientName;
    }
    if (addressEl) {
      addressEl.textContent = alamatPengiriman;
    }

    // Render seluruh item lalu hitung subtotal & grand total langsung di JS
    var rawItems = Array.isArray(data.items) ? data.items : [];
    var itemsContainer = document.getElementById("checkoutItemsContainer");
    var subtotal = 0;

    if (itemsContainer) {
      itemsContainer.innerHTML = "";
    }

    rawItems.forEach(function (rawItem, index) {
      var normalizedItem = normalisasiItem(rawItem);
      if (index === 0) {
        activeMode = normalizedItem.mode;
        activeUnits = normalizedItem.units;
        activeDays = normalizedItem.days;
      }

      subtotal += Number(normalizedItem.price) || 0;

      if (itemsContainer) {
        itemsContainer.appendChild(createItemElement(normalizedItem));
      }
    });

    var grandTotal = subtotal;

    var subTotalEl = document.getElementById("subTotalValue");
    if (subTotalEl) {
      subTotalEl.textContent = formatRupiah(subtotal);
    }

    var grandTotalEl = document.getElementById("grandTotalValue");
    if (grandTotalEl) {
      grandTotalEl.textContent = formatRupiah(grandTotal);
    }
  }

  // Ambil detail kendaraan dari beliSewa.php?id=... 
  function loadVehicleFromBeliSewa(id, checkoutBaseData) {
    var detailUrl = BELI_SEWA_PHP_URL + "?id=" + encodeURIComponent(id);

    return fetch(detailUrl, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Gagal mengambil detail kendaraan");
        }
        return res.json();
      })
      .then(function (result) {
        if (!result || !result.success || !result.data) {
          throw new Error((result && result.message) || "Vehicle not found");
        }

        var resolvedMode =
          (checkoutBaseData && checkoutBaseData.mode) || urlMode;
        var resolvedUnits =
          (checkoutBaseData && checkoutBaseData.units) || urlUnits;
        var resolvedDays =
          (checkoutBaseData &&
            (checkoutBaseData.days !== undefined
              ? checkoutBaseData.days
              : checkoutBaseData.duration_days)) ||
          urlDays;

        currentIdKendaraan = result.data.id_kendaraan || id;
        activeMode = String(resolvedMode).toLowerCase() === "rent" ? "rent" : "buy";
        activeUnits = Math.max(1, parseInt(resolvedUnits, 10) || 1);
        activeDays = Math.max(1, parseInt(resolvedDays, 10) || 1);

        var item = buatItemDariKendaraan(
          result.data,
          activeMode,
          activeUnits,
          activeDays
        );

        var merged = Object.assign({}, checkoutBaseData || {}, {
          id_kendaraan: currentIdKendaraan,
          mode: activeMode,
          units: activeUnits,
          days: activeDays,
          items: [item]
        });

        renderCheckout(merged);
      });
  }

  // Memuat data awal checkout via GET
  function loadCheckoutData() {
    var targetUrl = CHECKOUT_PHP_URL + window.location.search;

    fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Gagal memuat data checkout");
        }
        return response.json();
      })
      .then(function (data) {
        // Jika checkout.php sudah mengembalikan array items, render langsung
        var hasItems = Array.isArray(data && data.items) && data.items.length > 0;
        if (hasItems) {
          renderCheckout(data);
          return;
        }

        // Jika ada id_kendaraan dari $_SESSION['checkout'] atau parameter ?id= di URL, ambil detailnya dari beliSewa.php
        var targetId = urlId || (data && data.id_kendaraan);
        if (targetId) {
          return loadVehicleFromBeliSewa(targetId, data);
        }

        // Fallback ke keranjang di localStorage bila tidak ada data dari beliSewa / session
        var cartItems = ambilItemDariKeranjangStorage();
        if (cartItems.length > 0) {
          renderCheckout(Object.assign({}, data || {}, { items: cartItems }));
          return;
        }

        renderCheckout(data);
      })
      .catch(function (err) {
        console.error("Error loadCheckoutData:", err);
        if (urlId) {
          loadVehicleFromBeliSewa(urlId, null).catch(function (fallbackErr) {
            console.error("Fallback beliSewa error:", fallbackErr);
          });
          return;
        }

        var cartItems = ambilItemDariKeranjangStorage();
        if (cartItems.length > 0) {
          renderCheckout({ items: cartItems });
        }
      });
  }

  // kirim data pesanan via POST ke checkout.php
  var placeOrderBtn = document.getElementById("placeOrderBtn");
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", function () {
      var selectedMethod = getSelectedPaymentMethod();
      if (!selectedMethod) {
        alert("Choose payment method.");
        return;
      }

      // Cegah klik ganda saat request POST sedang berjalan
      placeOrderBtn.disabled = true;

      fetch(CHECKOUT_PHP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          action: "place_order",
          id_kendaraan: currentIdKendaraan,
          mode: activeMode,
          units: activeUnits,
          duration_days: activeMode === "rent" ? activeDays : 1,
          days: activeMode === "rent" ? activeDays : 1,
          payment_method: selectedMethod
        })
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Gagal memproses pesanan");
          }
          return response.json();
        })
        .then(function (result) {
          if (result.redirect) {
            window.location.href = result.redirect;
          } else if (result.message) {
            alert(result.message);
          }
        })
        .catch(function (err) {
          console.error("Error placeOrder:", err);
          alert("Terjadi kesalahan saat memproses pesanan.");
        })
        .finally(function () {
          placeOrderBtn.disabled = false;
        });
    });
  }

  loadCheckoutData();
});