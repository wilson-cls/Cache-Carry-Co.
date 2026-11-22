// Menyimpan jenis transaksi aktif ('buy' atau 'rent')
var currentType = 'buy';

// Menyimpan jumlah unit kendaraan yang dipilih (minimal 1)
var quantity = 1;

// Menyimpan durasi sewa dalam hari, dipakai di mode rent (minimal 1)
var durationDays = 1;

// Timer agar pop-up fade in & out
var cartPopupTimer = null;

// Mengatur tampilan transaksi buy/rent
function selectTransaction(type) {
  currentType = type;

  var buyCard = document.getElementById('trxBuy');
  var rentCard = document.getElementById('trxRent');
  var ctaBtn = document.getElementById('btnCheckout');
  var qtyBar = document.getElementById('qtyBar');

  if (type === 'buy') {
    buyCard.className = 'trxCard active';
    rentCard.className = 'trxCard';
    ctaBtn.innerHTML = 'BUY NOW';
    qtyBar.className = 'qtyBar';
  } else {
    buyCard.className = 'trxCard';
    rentCard.className = 'trxCard active';
    ctaBtn.innerHTML = 'RENT NOW';
    qtyBar.className = 'qtyBar rentMode';
  }
}

// Menambah/mengurangi jumlah unit kendaraan
function updateQty(delta) {
  quantity += delta;
  if (quantity < 1) {
    quantity = 1;
  }
  document.getElementById('qtyCount').innerHTML = quantity;
}

// Menambah/mengurangi durasi sewa
function updateDuration(delta) {
  durationDays += delta;
  if (durationDays < 1) {
    durationDays = 1;
  }
  document.getElementById('durationCount').innerHTML = durationDays;
}

// Menampilkan pop-up di tengah layar dengan efek fade-in lalu fade-out
function showBeliSewaPopup(text) {
  var msgEl = document.getElementById('cartMessage');
  if (!msgEl) {
    return;
  }

  msgEl.textContent = text;
  msgEl.classList.remove('show');
  void msgEl.offsetWidth;
  msgEl.classList.add('show');

  if (cartPopupTimer) {
    clearTimeout(cartPopupTimer);
  }

  cartPopupTimer = setTimeout(function () {
    msgEl.classList.remove('show');
  }, 2200);
}

// Menyimpan item ke keranjang via backend lalu memunculkan pop-up konfirmasi
function addToCart() {
  var nameEl = document.getElementById('productNameEl');
  var namaKendaraan = nameEl ? nameEl.textContent.trim() : 'Kendaraan';
  var slug = window.CURRENT_VEHICLE_SLUG || 'sunreef-80-power';

  var payload = {
    action: 'add_item',
    slug: slug,
    mode: currentType,
    units: quantity,
    duration_days: currentType === 'rent' ? durationDays : 1
  };

  var detail = currentType === 'rent'
    ? 'Sewa ' + quantity + ' unit (' + durationDays + ' hari)'
    : 'Beli ' + quantity + ' unit';

  if (typeof fetch === 'function') {
    fetch('cart_action.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data && data.status === 'ok') {
          showBeliSewaPopup('Berhasil dimasukkan ke keranjang: ' + namaKendaraan + ' (' + detail + ').');
        }
      })
  } else {
    showBeliSewaPopup('Berhasil dimasukkan ke keranjang: ' + namaKendaraan + ' (' + detail + ').');
  }
}

function goToCartPage() {
  window.location.href = 'cart.xhtml';
}

document.addEventListener('DOMContentLoaded', function () {
  var navMenu = document.getElementById('navMenu');
  if (!navMenu) {
    return;
  }

  var links = navMenu.getElementsByTagName('a');
  for (var i = 0; i < links.length; i++) {
    if (links[i].textContent.trim().toLowerCase() === 'cart') {
      links[i].setAttribute('href', 'cart.php');
      links[i].addEventListener('click', function (e) {
        e.preventDefault();
        goToCartPage();
      });
    }
  }
});