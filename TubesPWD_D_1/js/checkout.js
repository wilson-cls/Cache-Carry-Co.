document.addEventListener("DOMContentLoaded", function () {
  var CHECKOUT_PHP_URL = "checkout.php";
  var BELI_SEWA_PHP_URL = "beliSewa.php";
  // Perbaikan: kunci localStorage untuk menyimpan daftar alamat tambahan user agar tetap ada saat reload
  var SAVED_ADDRESS_STORAGE_KEY = "checkoutSavedAddresses";

  var params = new URLSearchParams(window.location.search);
  var urlId = params.get("id");
  var urlMode = params.get("mode") === "rent" ? "rent" : "buy";
  var urlUnits = Math.max(1, parseInt(params.get("units"), 10) || 1); // Minimal 1 unit; batas atas stok dicek di Beli/Sewa & backend
  var urlDays = Math.max(1, parseInt(params.get("days"), 10) || 1);   // Minimal 1 hari; tidak ada batas maksimum khusus

  // Menyimpan ID kendaraan aktif yang akan dikirim saat Place Order
  var currentIdKendaraan = urlId || null;
  // Perbaikan: simpan durasi hari sewa aktif (dari data/URL) dan mode aktif agar sinkron dengan tanggal sewa & Place Order
  var activeMode = urlMode;
  var activeDays = urlDays;
  // Perbaikan: simpan daftar alamat & alamat pengiriman yang sedang aktif dipilih user
  var addressOptions = [];
  var selectedAddress = "";

  // Format angka menjadi mata uang Rupiah (tanpa desimal)
  function formatRupiah(amount) {
    var num = Math.max(0, Math.round(Number(amount || 0)));
    return "Rp" + num.toLocaleString("id-ID");
  }

  // Ambil value opsi metode pembayaran yang dipilih user
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
        console.error("failed", err);
      }
    }
    return [];
  }

  // Perbaikan: ambil daftar alamat tersimpan dari localStorage
  function ambilAlamatTersimpanStorage() {
    try {
      var raw = window.localStorage.getItem(SAVED_ADDRESS_STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter(function (addr) {
            return typeof addr === "string" && addr.trim() !== "";
          })
        : [];
    } catch (err) {
      console.error("Gagal membaca daftar alamat dari localStorage:", err);
      return [];
    }
  }

  // Perbaikan: simpan daftar alamat terbaru ke localStorage
  function simpanAlamatKeStorage(list) {
    try {
      window.localStorage.setItem(SAVED_ADDRESS_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error("Gagal menyimpan daftar alamat ke localStorage:", err);
    }
  }

  // Perbaikan: gabungkan alamat dari backend/data checkout + localStorage tanpa duplikat
  function siapkanPilihanAlamat(data) {
    var list = [];
    function tambahKeList(addr) {
      if (typeof addr !== "string") return;
      var trimmed = addr.trim();
      if (!trimmed) return;
      if (list.indexOf(trimmed) === -1) {
        list.push(trimmed);
      }
    }

    var primaryAddr =
      (data &&
        (data.alamat_pengiriman ||
          data.recipient_address ||
          data.alamat_penerima)) ||
      "";
    tambahKeList(primaryAddr);

    if (data && Array.isArray(data.addresses)) {
      data.addresses.forEach(function (item) {
        if (typeof item === "string") {
          tambahKeList(item);
        } else if (item && typeof item === "object") {
          tambahKeList(item.alamat || item.alamat_pengiriman || item.address || "");
        }
      });
    }

    ambilAlamatTersimpanStorage().forEach(function (addr) {
      tambahKeList(addr);
    });

    addressOptions = list;
    if (!selectedAddress || addressOptions.indexOf(selectedAddress) === -1) {
      selectedAddress = addressOptions.length > 0 ? addressOptions[0] : "";
    }
  }

  // daftar pilihan alamat beserta tombol hapus
  function renderAddressOptions() {
    var addressEl = document.getElementById("recipientAddress");
    if (addressEl) {
      addressEl.textContent = selectedAddress;
    }

    var listContainer = document.getElementById("savedAddressList");
    if (!listContainer) return;

    listContainer.innerHTML = "";

    if (addressOptions.length === 0) {
      var emptyText = document.createElement("div");
      emptyText.className = "address-empty";
      emptyText.textContent = "You haven’t added an address yet.";
      listContainer.appendChild(emptyText);
      return;
    }

    addressOptions.forEach(function (addr, idx) {
      var row = document.createElement("div");
      row.className = "address-option-row";

      var itemBtn = document.createElement("button");
      itemBtn.type = "button";
      var isActive = addr === selectedAddress;
      itemBtn.className = isActive ? "address-option active" : "address-option";

      var label = document.createElement("span");
      label.className = "address-option-label";
      label.textContent = addr;

      var status = document.createElement("span");
      status.className = "address-option-status";
      status.textContent = isActive ? "Selected" : "Select";

      itemBtn.appendChild(label);
      itemBtn.appendChild(status);

      itemBtn.addEventListener("click", function () {
        selectedAddress = addr;
        renderAddressOptions();
      });

      // Perbaikan: hapus alamat dari daftar aktif dan localStorage
      var deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-delete-address";
      deleteBtn.textContent = "x";

      deleteBtn.addEventListener("click", function (e) {
        e.stopPropagation();

        addressOptions = addressOptions.filter(function (item) {
          return item !== addr;
        });

        var updatedStored = ambilAlamatTersimpanStorage().filter(function (item) {
          return item !== addr;
        });
        simpanAlamatKeStorage(updatedStored);

        if (selectedAddress === addr) {
          selectedAddress = addressOptions.length > 0 ? addressOptions[0] : "";
        }

        renderAddressOptions();
      });

      row.appendChild(itemBtn);
      row.appendChild(deleteBtn);
      listContainer.appendChild(row);
    });
  }

  // Perbaikan: helper format tanggal lokal YYYY-MM-DD agar tidak bergeser zona waktu
  function formatDateLocalISO(dateObj) {
    var year = dateObj.getFullYear();
    var month = String(dateObj.getMonth() + 1).padStart(2, "0");
    var day = String(dateObj.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  // Perbaikan: helper format tanggal tampilan yang mudah dibaca
  function formatTanggalTampil(dateObj) {
    return dateObj.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function hitungTanggalSelesai(startDateValue, durationDays) {
      if (!startDateValue) {
          return null;
      }

      var parts = startDateValue.split("-").map(Number);

      if (parts.length !== 3 || parts.some(isNaN)) {
          return null;
      }

      var startDate = new Date(
          parts[0],
          parts[1] - 1,
          parts[2]
      );

      var days = Math.max(1, parseInt(durationDays, 10) || 1);

      var endDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate() + days - 1
      );

      return endDate;
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
    price.textContent = formatRupiah(item.price);

    var unit = document.createElement("div");
    unit.className = "item-unit";
    unit.textContent = item.unit || "";

    priceBox.appendChild(price);
    priceBox.appendChild(unit);

    card.appendChild(thumb);
    card.appendChild(info);
    card.appendChild(priceBox);

    // tanggal hanya ditampilkan untuk kendaraan sewa
    if(item.mode === 'rent') {
       var dateSection = document.createElement("div");
        dateSection.className = "rental-date-item";

        var dateLabel = document.createElement("label");
        dateLabel.textContent = "Rental Start Date";

        var startInput = document.createElement("input");
        startInput.type = "date";
        startInput.className = "rental-start-date";
        startInput.setAttribute(
          "data-duration-days",
          item.duration_days
        );
        startInput.setAttribute(
            "data-id-kendaraan",
            item.id_kendaraan
        );

        // Default tanggal mulai adalah hari ini
        var today = formatDateLocalISO(new Date());
        startInput.value = today;
        startInput.min = today;

        var endLabel = document.createElement("div");
        endLabel.className = "rental-end-date";

        function updateEndDate() {
            var endDate = hitungTanggalSelesai(
                startInput.value,
                item.duration_days
            );

            if (endDate) {
                endLabel.textContent =
                    "Rental End Date: " + formatTanggalTampil(endDate);
            } else {
                endLabel.textContent = "Rental End Date: -";
            }
        }

        // Perbarui tanggal selesai saat tanggal mulai berubah
        startInput.addEventListener("change", updateEndDate);

        updateEndDate();

        dateSection.appendChild(dateLabel);
        dateSection.appendChild(startInput);
        dateSection.appendChild(endLabel);

        card.appendChild(dateSection);
    }

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

    // Perbaikan: sinkronkan mode aktif dan durasi hari dari data checkout
    if (data.mode) {
      activeMode = String(data.mode).toLowerCase() === "rent" ? "rent" : "buy";
    }
    if (data.days !== undefined || data.duration_days !== undefined) {
      activeDays = Math.max(
        1,
        parseInt(data.days !== undefined ? data.days : data.duration_days, 10) || 1
      );
    }

    // Tampilkan data penerima dan alamat pengiriman
    var nameEl = document.getElementById("recipientName");
    var recipientName = data.recipient_name || data.nama_penerima || "";

    if (nameEl) {
      nameEl.textContent = recipientName;
    }
    // Perbaikan: siapkan & render pilihan alamat tersimpan serta alamat aktif
    siapkanPilihanAlamat(data);
    renderAddressOptions();

    var rawItems = Array.isArray(data.items) ? data.items : [];
    var itemsContainer = document.getElementById("checkoutItemsContainer");
    var subtotal = 0;

    if (itemsContainer) {
      itemsContainer.innerHTML = "";
    }

    rawItems.forEach(function (rawItem, index) {
      var normalizedItem = normalisasiItem(rawItem);
      // Perbaikan: ambil mode & durasi hari item pertama untuk menyelaraskan rentang tanggal sewa
      if (index === 0) {
        activeMode = normalizedItem.mode;
        activeDays = normalizedItem.duration_days;
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

  // Perbaikan: handler tombol buka/tutup/simpan/batal form tambah alamat baru
  var toggleAddAddressBtn = document.getElementById("toggleAddAddressBtn");
  var newAddressForm = document.getElementById("newAddressForm");
  var newAddressInput = document.getElementById("newAddressInput");
  var saveNewAddressBtn = document.getElementById("saveNewAddressBtn");
  var cancelNewAddressBtn = document.getElementById("cancelNewAddressBtn");

  if (toggleAddAddressBtn && newAddressForm) {
    toggleAddAddressBtn.addEventListener("click", function () {
      var isHidden =
        newAddressForm.style.display === "none" || !newAddressForm.style.display;
      newAddressForm.style.display = isHidden ? "flex" : "none";
      if (isHidden && newAddressInput) {
        newAddressInput.focus();
      }
    });
  }

  if (cancelNewAddressBtn && newAddressForm && newAddressInput) {
    cancelNewAddressBtn.addEventListener("click", function () {
      newAddressInput.value = "";
      newAddressForm.style.display = "none";
    });
  }

  if (saveNewAddressBtn && newAddressInput) {
    saveNewAddressBtn.addEventListener("click", function () {
      var value = newAddressInput.value.trim();
      if (!value) {
        alert("Alamat baru tidak boleh kosong.");
        return;
      }

      if (addressOptions.indexOf(value) === -1) {
        addressOptions.push(value);
      }
      selectedAddress = value;

      var stored = ambilAlamatTersimpanStorage();
      if (stored.indexOf(value) === -1) {
        stored.push(value);
        simpanAlamatKeStorage(stored);
      }

      newAddressInput.value = "";
      if (newAddressForm) {
        newAddressForm.style.display = "none";
      }
      renderAddressOptions();
    });
  }

  // Perbaikan: inisialisasi awal pilihan alamat (termasuk yang ada di localStorage) sebelum fetch selesai
  siapkanPilihanAlamat(null);
  renderAddressOptions();

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
        alert("Choose payment method.");
        return;
      }

      //ambil semua input tanggal dari kartu kendaraan sewa
      var rentalInputs = document.querySelectorAll(
        "#checkoutItemsContainer .rental-start-date"
      )

      var rentalItems = [];
      var tanggalTidakValid = false;

      rentalInputs.forEach(function (input) {
        var idKendaraan = parseInt(input.getAttribute("data-id-kendaraan"), 10);

        var tanggalMulai = input.value;

        if(!tanggalMulai){
          tanggalTidakValid = true;
          return;
        }

        rentalItems.push({
          id_kendaraan: idKendaraan,
          start_date: tanggalMulai,
          duration_days: parseInt(input.getAttribute("data-duration-days"), 10)
        });
      });

      if(tanggalTidakValid){
        alert("Please select a rental start date for every rented vehicle");
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
          alamat_pengiriman: selectedAddress,
          items: rentalItems
        })
      })

        .then(function (response) {
          return response.json().then(function(result) {
            if (!response.ok) {
              throw new Error(result.message || "Failed to process order");
            }

            return result;
          });
        })

        .then(function (result) {
          if (result.success && result.redirect) {
                window.location.href = result.redirect;
          } else if (result.message) {
                alert(result.message);
          }
        })

        .catch(function (err) {
          console.error("Error placeOrder:", err);
          alert(err.message || "An error occurred while processing your order.");
        })

        .finally(function () {
          placeOrderBtn.disabled = false;
        });
    });
  }

  // pengambilan data saat halaman selesai diload
  loadCheckoutData();
});