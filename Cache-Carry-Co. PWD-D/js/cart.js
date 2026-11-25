// Data awal dari backend PHP (window.INITIAL_CART_ITEMS)
var cartItems = Array.isArray(window.INITIAL_CART_ITEMS) ? window.INITIAL_CART_ITEMS.slice() : [];

// ID item yang sedang dicentang
var selectedIds = [];

// Timer pop-up notifikasi
var cartPopupTimer = null;

// Format angka menjadi Rupiah
function formatRupiah(num) {
  var angka = Math.max(0, Math.round(Number(num) || 0));
  return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Hitung subtotal per item
function hitungSubtotal(item) {
  var units = Math.max(1, parseInt(item.units, 10) || 1);
  if (item.mode === 'rent') {
    var days = Math.max(1, parseInt(item.duration_days, 10) || 1);
    return (Number(item.harga_sewa) || 0) * units * days;
  }
  return (Number(item.harga_beli) || 0) * units;
}

// Tampilkan pop-up di tengah layar (fade-in & fade-out)
function showCartPopup(text) {
  var msgEl = document.getElementById('cartMessage');
  if (!msgEl) {
    return;
  }

  msgEl.textContent = text;
  msgEl.style.color = "white";
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

// Sinkronisasi perubahan ke backend PHP
function syncCartAction(actionName, payload) {
  if (typeof fetch !== 'function') {
    return;
  }
  var bodyData = Object.assign({ action: actionName }, payload || {});
  fetch('cart_action.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyData)
  }).catch(function () {});
}

// Ubah mode buy / rent
function setItemMode(itemId, mode) {
  for (var i = 0; i < cartItems.length; i++) {
    if (String(cartItems[i].id) === String(itemId)) {
      cartItems[i].mode = mode === 'rent' ? 'rent' : 'buy';
      if (!cartItems[i].duration_days || cartItems[i].duration_days < 1) {
        cartItems[i].duration_days = 1;
      }
      break;
    }
  }
  renderCart();
  syncCartAction('update_mode', { id: itemId, mode: mode });
}

// Ubah jumlah unit
function changeItemUnits(itemId, delta) {
  var updatedUnits = 1;
  for (var i = 0; i < cartItems.length; i++) {
    if (String(cartItems[i].id) === String(itemId)) {
      cartItems[i].units = Math.max(1, (parseInt(cartItems[i].units, 10) || 1) + delta);
      updatedUnits = cartItems[i].units;
      break;
    }
  }
  renderCart();
  syncCartAction('update_qty', { id: itemId, units: updatedUnits });
}

// Ubah durasi sewa (hari)
function changeItemDuration(itemId, delta) {
  var updatedDays = 1;
  for (var i = 0; i < cartItems.length; i++) {
    if (String(cartItems[i].id) === String(itemId)) {
      cartItems[i].duration_days = Math.max(1, (parseInt(cartItems[i].duration_days, 10) || 1) + delta);
      updatedDays = cartItems[i].duration_days;
      break;
    }
  }
  renderCart();
  syncCartAction('update_duration', { id: itemId, duration_days: updatedDays });
}

// Centang 1 item
function toggleSelectItem(itemId) {
  var idStr = String(itemId);
  var idx = selectedIds.indexOf(idStr);
  if (idx === -1) {
    selectedIds.push(idStr);
  } else {
    selectedIds.splice(idx, 1);
  }
  updateSelectBarAndTotal();
}

// Centang semua item
function toggleSelectAll() {
  var selectAllBox = document.getElementById('selectAllBox');
  selectedIds = [];
  if (selectAllBox && selectAllBox.checked) {
    for (var i = 0; i < cartItems.length; i++) {
      selectedIds.push(String(cartItems[i].id));
    }
  }

  var selectBarEl = document.querySelector('.selectBar');
  if (selectBarEl) {
    selectBarEl.classList.toggle('active', selectedIds.length > 0);
  }

  updateSelectBarAndTotal();
}

// Hapus 1 item
function removeItem(itemId) {
  cartItems = cartItems.filter(function (item) {
    return String(item.id) !== String(itemId);
  });
  selectedIds = selectedIds.filter(function (id) {
    return id !== String(itemId);
  });
  renderCart();
  syncCartAction('remove_item', { id: itemId });
  showCartPopup('Item removed from cart');
}

// Hapus item yang dicentang
function removeSelectedItems() {
  if (selectedIds.length === 0) {
    showCartPopup('choose at least one vehicle to remove from the cart');
    return;
  }

  var idsToRemove = selectedIds.slice();
  cartItems = cartItems.filter(function (item) {
    return idsToRemove.indexOf(String(item.id)) === -1;
  });
  selectedIds = [];

  renderCart();
  syncCartAction('remove_selected', { ids: idsToRemove });
  showCartPopup('Selected items removed from cart.');
}

// Update label "Select All" dan Grand Total
function updateSelectBarAndTotal() {
  var totalCount = cartItems.length;
  var checkedCount = 0;
  var grandTotal = 0;

  for (var i = 0; i < cartItems.length; i++) {
    var item = cartItems[i];
    var isChecked = selectedIds.indexOf(String(item.id)) !== -1;
    var cbEl = document.getElementById('chk_' + item.id);
    if (cbEl) {
      cbEl.checked = isChecked;
    }
    if (isChecked) {
      checkedCount += 1;
      grandTotal += hitungSubtotal(item);
    }
  }

  var selectAllTextEl = document.getElementById('selectAllText');
  if (selectAllTextEl) {
    selectAllTextEl.textContent = 'Select All Vehicles (' + checkedCount + ' of ' + totalCount + ')';
  }

  var selectAllBox = document.getElementById('selectAllBox');
  if (selectAllBox) {
    selectAllBox.checked = totalCount > 0 && checkedCount === totalCount;
  }

  var totalValEl = document.getElementById('cartTotalVal');
  if (totalValEl) {
    totalValEl.textContent = formatRupiah(grandTotal);
  }
}

// Render daftar item dengan clone #cartCardTemplate dari XHTML
function renderCart() {
  var listEl = document.getElementById('cartItemList');
  var tplEl = document.getElementById('cartCardTemplate');
  if (!listEl || !tplEl) {
    return;
  }

  listEl.innerHTML = '';

  if (cartItems.length === 0) {
    var emptyDiv = document.createElement('div');
    emptyDiv.className = 'emptyCartBox';
    emptyDiv.textContent = 'Cart is empty. Add vehicles to the cart first';
    emptyDiv.style.color = "white";
    listEl.appendChild(emptyDiv);
    updateSelectBarAndTotal();
    return;
  }

  for (var i = 0; i < cartItems.length; i++) {
    var item = cartItems[i];
    var isRent = item.mode === 'rent';
    var unitPrice = isRent ? (Number(item.harga_sewa) || 0) : (Number(item.harga_beli) || 0);
    var priceLabel = isRent ? 'Daily Rental Price' : 'Unit Purchase Price';
    var subtotal = hitungSubtotal(item);
    var isChecked = selectedIds.indexOf(String(item.id)) !== -1;

    var clone = tplEl.content.cloneNode(true);
    var cardEl = clone.querySelector('.cartCard');
    if (isRent) {
      cardEl.classList.add('rentMode');
    }

    var imgEl = clone.querySelector('.js-thumb');
    imgEl.src = item.gambar;
    imgEl.alt = item.nama;

    clone.querySelector('.js-title').textContent = item.nama;
    clone.querySelector('.js-meta').textContent = item.info || '';

    var delBtn = clone.querySelector('.js-delete');
    delBtn.setAttribute('onclick', 'removeItem("' + item.id + '")');

    var buyBtn = clone.querySelector('.js-btn-buy');
    var rentBtn = clone.querySelector('.js-btn-rent');
    buyBtn.className = 'modeBtn js-btn-buy' + (!isRent ? ' active' : '');
    rentBtn.className = 'modeBtn js-btn-rent' + (isRent ? ' active' : '');
    buyBtn.setAttribute('onclick', 'setItemMode("' + item.id + '", "buy")');
    rentBtn.setAttribute('onclick', 'setItemMode("' + item.id + '", "rent")');

    clone.querySelector('.js-price-label').textContent = priceLabel;
    clone.querySelector('.js-price-val').textContent = formatRupiah(unitPrice);

    var chkEl = clone.querySelector('.js-check');
    chkEl.id = 'chk_' + item.id;
    chkEl.checked = isChecked;
    chkEl.setAttribute('onchange', 'toggleSelectItem("' + item.id + '")');

    clone.querySelector('.js-unit-val').textContent = Math.max(1, parseInt(item.units, 10) || 1);
    clone.querySelector('.js-unit-minus').setAttribute('onclick', 'changeItemUnits("' + item.id + '", -1)');
    clone.querySelector('.js-unit-plus').setAttribute('onclick', 'changeItemUnits("' + item.id + '", 1)');

    clone.querySelector('.js-day-val').textContent = Math.max(1, parseInt(item.duration_days, 10) || 1);
    clone.querySelector('.js-day-minus').setAttribute('onclick', 'changeItemDuration("' + item.id + '", -1)');
    clone.querySelector('.js-day-plus').setAttribute('onclick', 'changeItemDuration("' + item.id + '", 1)');

    clone.querySelector('.js-subtotal-val').textContent = formatRupiah(subtotal);

    listEl.appendChild(clone);
  }

  updateSelectBarAndTotal();
}

// Proses checkout
function checkoutCart() {
  if (selectedIds.length === 0) {
    showCartPopup('choose at least one vehicle to checkout');
    return;
  }
  syncCartAction('checkout', { ids: selectedIds });
}

renderCart();