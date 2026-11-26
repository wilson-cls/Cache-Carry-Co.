document.addEventListener("DOMContentLoaded", function () {
  // Sesuaikan path ke file checkout.php kamu
  const CHECKOUT_PHP_URL = "../Cache-Carry-Co. PWD-D/checkout.php";

  // nyimpan id_kendaraan
  let currentIdKendaraan = null;

  function formatRupiah(amount) {
    const num = Number(amount || 0);
    return "Rp" + num.toLocaleString("id-ID");
  }

  // opsi payment_method yang sedang dipilih
  function getSelectedPaymentMethod() {
    const checked = document.querySelector('input[name="payment_method"]:checked');
    return checked ? checked.value : "";
  }

  // card item di dalam #checkoutItemsContainer
  function createItemElement(item) {
    const card = document.createElement("div");
    card.className = "checkout-item";

    const thumb = document.createElement("div");
    thumb.className = "item-thumb";
    if (item.image) {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.name || "Kendaraan";
      thumb.appendChild(img);
    }

    const info = document.createElement("div");
    info.className = "item-info";

    if (item.type) {
      const badge = document.createElement("span");
      badge.className = "item-badge";
      badge.textContent = item.type;
      info.appendChild(badge);
    }

    const name = document.createElement("div");
    name.className = "item-name";
    name.textContent = item.name || "";

    const origin = document.createElement("div");
    origin.className = "item-origin";
    origin.textContent = item.origin ? "From " + item.origin : "";

    info.appendChild(name);
    info.appendChild(origin);

    const priceBox = document.createElement("div");
    priceBox.className = "item-price-box";

    const price = document.createElement("div");
    price.className = "item-price";
    price.textContent = item.price !== undefined && item.price !== null ? formatRupiah(item.price) : "";

    const unit = document.createElement("div");
    unit.className = "item-unit";
    unit.textContent = item.unit || "";

    priceBox.appendChild(price);
    priceBox.appendChild(unit);

    card.appendChild(thumb);
    card.appendChild(info);
    card.appendChild(priceBox);

    return card;
  }

  // render seluruh data checkout ke elemen xml
  function renderCheckout(data) {
    if (!data) return;

    // ambil id_kendaraan
    if (data.id_kendaraan !== undefined && data.id_kendaraan !== null) {
      currentIdKendaraan = data.id_kendaraan;
    } else if (Array.isArray(data.items) && data.items.length > 0 && data.items[0].id_kendaraan) {
      currentIdKendaraan = data.items[0].id_kendaraan;
    }

    // nama penerima dan alamat pengiriman
    const nameEl = document.getElementById("recipientName");
    const addressEl = document.getElementById("recipientAddress");
    const recipientName = data.recipient_name || data.nama_penerima || "";
    const alamatPengiriman =
      data.alamat_pengiriman || data.recipient_address || data.alamat_penerima || "";

    if (nameEl) {
      nameEl.textContent = recipientName;
    }
    if (addressEl) {
      addressEl.textContent = alamatPengiriman;
    }

    // daftar item vehicle
    const itemsContainer = document.getElementById("checkoutItemsContainer");
    if (itemsContainer) {
      itemsContainer.innerHTML = "";
      const items = Array.isArray(data.items) ? data.items : [];
      items.forEach(function (item) {
        itemsContainer.appendChild(createItemElement(item));
      });
    }

    // subtotal
    const subTotalEl = document.getElementById("subTotalValue");
    if (subTotalEl && data.subtotal !== undefined && data.subtotal !== null) {
      subTotalEl.textContent = formatRupiah(data.subtotal);
    }

    // Total Payment di footer
    const grandTotalEl = document.getElementById("grandTotalValue");
    if (grandTotalEl && data.grand_total !== undefined && data.grand_total !== null) {
      grandTotalEl.textContent = formatRupiah(data.grand_total);
    }
  }

  // ambil data checkout
  function loadCheckoutData() {
    fetch(CHECKOUT_PHP_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Gagal memuat data checkout");
        }
        return response.json();
      })
      .then(function (data) {
        renderCheckout(data);
      })
      .catch(function (err) {
        console.error("Error loadCheckoutData:", err);
      });
  }

  // Proses pesanan saat tombol PLACE ORDER diklik (POST)
  const placeOrderBtn = document.getElementById("placeOrderBtn");
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", function () {
      const selectedMethod = getSelectedPaymentMethod();
      if (!selectedMethod) {
        alert("Silakan pilih metode pembayaran (Credit Card atau Debit) terlebih dahulu.");
        return;
      }

      placeOrderBtn.disabled = true;

      fetch(CHECKOUT_PHP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          action: "place_order",
          id_kendaraan: currentIdKendaraan,
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

  // saat halaman selesai dimuat
  loadCheckoutData();
});