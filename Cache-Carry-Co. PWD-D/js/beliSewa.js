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

// pop-up berhasil masukin ke keranjang tengah layar
function addToCart() {
  var nameEl = document.getElementById('productNameEl');
  var msgEl = document.getElementById('cartMessage');
  var namaKendaraan = nameEl ? nameEl.textContent.trim() : 'Kendaraan';

  var detail = currentType === 'rent'
    ? 'Sewa ' + quantity + ' unit (' + durationDays + ' hari)'
    : 'Beli ' + quantity + ' unit';

  if (!msgEl) {
    return;
  }

  msgEl.textContent = 'Product added to your cart! ';

  // Reset trus aktifin class 'show' untuk munculin fade in
  msgEl.classList.remove('show');
  void msgEl.offsetWidth;
  msgEl.classList.add('show');

  if (cartPopupTimer) {
    clearTimeout(cartPopupTimer);
  }

  // Hapus class 'show' setelah 2,2 detik untuk munculin fade out
  cartPopupTimer = setTimeout(function () {
    msgEl.classList.remove('show');
  }, 2200);
}