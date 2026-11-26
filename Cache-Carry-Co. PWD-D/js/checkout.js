document.addEventListener("DOMContentLoaded", function () {
  // Endpoint PHP untuk data checkout & pemrosesan pesanan, serta detail kendaraan dari halaman Beli/Sewa
  var CHECKOUT_PHP_URL = "checkout.php";
  var BELI_SEWA_PHP_URL = "beliSewa.php";

  // Ambil parameter dari query string URL (dikirim dari halaman Beli/Sewa) dan amankan nilai minimalnya
  var params = new URLSearchParams(window.location.search);
  var urlId = params.get("id");
  var urlMode = params.get("mode") === "rent" ? "rent" : "buy";
  var urlUnits = Math.max(1, parseInt(params.get("units"), 10) || 1); // Minimal 1 unit; batas atas stok dicek di Beli/Sewa & backend
  var urlDays = Math.max(1, parseInt(params.get("days"), 10) || 1);   // Minimal 1 hari; tidak ada batas maksimum khusus

  // Menyimpan ID kendaraan aktif yang akan dikirim saat Place Order
  var currentIdKendaraan = urlId || null;

  // Format angka menjadi mata uang Rupiah (tanpa desimal)
  function formatRupiah(amount) {
    var num = Math.max(0, Math.round(Number(amount || 0)));
    return "Rp" + num.toLocaleString("id-ID");
  }

  // Ambil nilai radio button metode pembayaran yang sedang dipilih user
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

  // Ambil durasi sewa dalam hari (minimal 1; khusus mode rent)
  function resolveItemDays(item, days) {
    var raw =
      days !== undefined
        ? days
        : (item &&
            (item.duration_days !== undefined
              ? item.duration_days
              : item.days));
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

  // format label jumlah unit & durasi sewa agar selalu sinkron dengan isi keranjang atau Beli/Sewa
  function formatUnitLabel(item, mode, units, days) {
    var resolvedMode = resolveItemMode(item, mode);
    var qty = resolveItemUnits(item, units);
    var durasi = resolveItemDays(item, days);

    if (resolvedMode === "rent") {
      return qty + " unit(s) x " + durasi + " day(s)";
    }
    return qty + " unit(s)";
  }

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
      duration_days: durasi,
      name: (item && (item.nama || item.name)) || "",
      origin:
        (item && item.origin) || originParts.join(" • "),
      price: finalPrice,
      unit: formatUnitLabel(item, resolvedMode, qty, durasi)
    };
  }

  // Susun objek item checkout dari detail kendaraan Beli/Sewa
  function buatItemDariKendaraan(kendaraan, mode, units, days) {
    return normalisasiItem(kendaraan, mode, units, days);
  }

  // ambil daftar item dari keranjang
  function ambilItemDariKeranjangStorage() {
    var keys = ["cart", "cartItems", "keranjang", "checkoutCart"];
    for (var i = 0; i < keys.length; i++) {
      var raw = null;
      try {
        raw = window.localStorage.getItem(keys[i]);
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

  // kartu untuk satu item di daftar checkout
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

    // Informasi utama item (badge buy/rent, nama)
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

  // Render seluruh data checkout (penerima, daftar item, subtotal, dan grand total) ke halaman
  function renderCheckout(data) {
    if (!data) return;

    // Sinkronkan currentIdKendaraan dari respons backend jika tersedia
    if (data.id_kendaraan !== undefined && data.id_kendaraan !== null) {
      currentIdKendaraan = data.id_kendaraan;
    } else if (
      Array.isArray(data.items) &&
      data.items.length > 0 &&
      data.items[0].id_kendaraan
    ) {
      currentIdKendaraan = data.items[0].id_kendaraan;
    }

    // Tampilkan data penerima dan alamat pengiriman
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

    var rawItems = Array.isArray(data.items) ? data.items : [];
    var itemsContainer = document.getElementById("checkoutItemsContainer");
    var subtotal = 0;

    if (itemsContainer) {
      itemsContainer.innerHTML = "";
    }

    rawItems.forEach(function (rawItem) {
      var normalizedItem = normalisasiItem(rawItem);
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
        var item = buatItemDariKendaraan(
          result.data,
          urlMode,
          urlUnits,
          urlDays
        );
        var merged = Object.assign({}, checkoutBaseData || {}, {
          id_kendaraan: result.data.id_kendaraan || id,
          items: [item]
        });
        renderCheckout(merged);
      });
  }

  // Memuat data awal checkout
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
        var hasItems = Array.isArray(data && data.items) && data.items.length > 0;
        if (hasItems) {
          renderCheckout(data);
          return;
        }

        if (urlId) {
          return loadVehicleFromBeliSewa(urlId, data);
        }

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

  // kirim data pesanan
  var placeOrderBtn = document.getElementById("placeOrderBtn");
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", function () {
      var selectedMethod = getSelectedPaymentMethod();
      if (!selectedMethod) {
        alert(
          "Choose payment methode."
        );
        return;
      }

      // supaya tidak terjadi klik ganda saat req POST berjalan
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
          mode: urlMode,
          units: urlUnits,
          duration_days: urlMode === "rent" ? urlDays : 1,
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

  // pengambilan data saat halaman selesai diload
  loadCheckoutData();
});