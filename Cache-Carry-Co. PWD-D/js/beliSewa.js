// Frame default kosong untuk data kendaraan (diisi oleh backend via window.INITIAL_VEHICLE atau renderVehicle)
var VEHICLE_FRAME = {
  id: '',
  nama: '',
  info: '',
  gambar: '',
  harga_beli: 0,
  harga_sewa: 0,
  specs: [] // Frame array spesifikasi: [{ value: '', label: '' }]
};

// Frame default kotak spesifikasi bila backend belum mengisi specs
var DEFAULT_SPEC_FRAME = [
  { value: '', label: '' },
  { value: '', label: '' },
  { value: '', label: '' },
  { value: '', label: '' }
];

// data kendaraan aktif(selected) yang masuk ke frame
var currentVehicle = Object.assign({}, VEHICLE_FRAME, window.INITIAL_VEHICLE || {});

// transaksi di halaman Beli & Sewa
var trxState = {
  mode: 'buy', // 'buy' atau 'rent'
  units: 1,
  duration_days: 1
};

var beliSewaPopupTimer = null;

function cloneTemplate(tpl) {
  var frag = document.createDocumentFragment();
  var src = (tpl.content && tpl.content.childNodes.length) ? tpl.content : tpl;
  for (var i = 0; i < src.childNodes.length; i++) {
    frag.appendChild(src.childNodes[i].cloneNode(true));
  }
  return frag;
}

// format angka menjadi Rupiah
function formatRupiah(num) {
  var angka = Math.max(0, Math.round(Number(num) || 0));
  return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// total transaksi berdasarkan mode, unit, dan durasi
function hitungTotalBeliSewa() {
  var units = Math.max(1, parseInt(trxState.units, 10) || 1);
  if (trxState.mode === 'rent') {
    var days = Math.max(1, parseInt(trxState.duration_days, 10) || 1);
    return (Number(currentVehicle.harga_sewa) || 0) * units * days;
  }
  return (Number(currentVehicle.harga_beli) || 0) * units;
}

// menampilkan pesan/notifikasi di #cartMessage
function showBeliSewaPopup(text) {
  var msgEl = document.getElementById('cartMessage');
  if (!msgEl) {
    return;
  }

  msgEl.textContent = text;
  msgEl.classList.remove('show');
  void msgEl.offsetWidth;
  msgEl.classList.add('show');

  if (beliSewaPopupTimer) {
    clearTimeout(beliSewaPopupTimer);
  }

  beliSewaPopupTimer = setTimeout(function () {
    msgEl.classList.remove('show');
  }, 2200);
}

// Kirim aksi ke endpoint backend
function syncBeliSewaAction(actionName, payload) {
  if (typeof fetch !== 'function') {
    return;
  }
  var bodyData = Object.assign({ action: actionName }, payload || {});
  fetch('beli_sewa_action.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyData)
  }).catch(function () {});
}

// mode transaksi buy/rent
function selectTransaction(mode) {
  trxState.mode = mode === 'rent' ? 'rent' : 'buy';
  if (!trxState.duration_days || trxState.duration_days < 1) {
    trxState.duration_days = 1;
  }
  updateTransactionUI();
}

// jumlah unit (+/-)
function updateQty(delta) {
  trxState.units = Math.max(1, (parseInt(trxState.units, 10) || 1) + delta);
  var qtyEl = document.getElementById('qtyCount');
  if (qtyEl) {
    qtyEl.textContent = trxState.units;
  }
}

// durasi sewa dalam hari (+/-)
function updateDuration(delta) {
  trxState.duration_days = Math.max(1, (parseInt(trxState.duration_days, 10) || 1) + delta);
  var dayEl = document.getElementById('durationCount');
  if (dayEl) {
    dayEl.textContent = trxState.duration_days;
  }
}

// tampilan mode buy/rent, unit, dan durasi
function updateTransactionUI() {
  var isRent = trxState.mode === 'rent';
  var buyCard = document.getElementById('trxBuy');
  var rentCard = document.getElementById('trxRent');
  var durationGroup = document.getElementById('durationGroup');
  var btnCheckout = document.getElementById('btnCheckout');
  var qtyEl = document.getElementById('qtyCount');
  var dayEl = document.getElementById('durationCount');

  if (buyCard) {
    buyCard.className = 'trxCard' + (!isRent ? ' active' : '');
  }
  if (rentCard) {
    rentCard.className = 'trxCard' + (isRent ? ' active' : '');
  }
  if (durationGroup) {
    durationGroup.style.display = isRent ? 'flex' : 'none';
  }
  if (btnCheckout) {
    btnCheckout.textContent = isRent ? 'RENT NOW' : 'BUY NOW';
  }
  if (qtyEl) {
    qtyEl.textContent = Math.max(1, parseInt(trxState.units, 10) || 1);
  }
  if (dayEl) {
    dayEl.textContent = Math.max(1, parseInt(trxState.duration_days, 10) || 1);
  }
}

// render grid spesifikasi ke dalam frame #specList
function renderSpecs(specs) {
  var listEl = document.getElementById('specList');
  if (!listEl) {
    return;
  }

  var items = (Array.isArray(specs) && specs.length > 0) ? specs : DEFAULT_SPEC_FRAME;
  listEl.textContent = '';

  for (var i = 0; i < items.length; i++) {
    var spec = Object.assign({ value: '', label: '' }, items[i] || {});

    var box = document.createElement('div');
    box.className = 'specBox';

    var val = document.createElement('div');
    val.className = 'specVal js-spec-val';
    val.textContent = spec.value;

    var lbl = document.createElement('div');
    lbl.className = 'specLbl js-spec-lbl';
    lbl.textContent = spec.label;

    box.appendChild(val);
    box.appendChild(lbl);
    listEl.appendChild(box);
  }
}

// pasang event ke semua tombol & kartu yang sudah di-render di container
function bindBeliSewaEvents(container) {
  var buyCard = container.querySelector('.js-trx-buy') || document.getElementById('trxBuy');
  var rentCard = container.querySelector('.js-trx-rent') || document.getElementById('trxRent');
  var qtyMinus = container.querySelector('.js-qty-minus');
  var qtyPlus = container.querySelector('.js-qty-plus');
  var dayMinus = container.querySelector('.js-day-minus');
  var dayPlus = container.querySelector('.js-day-plus');
  var addCartBtn = container.querySelector('.js-add-cart');
  var checkoutBtn = container.querySelector('.js-checkout') || document.getElementById('btnCheckout');

  if (buyCard) {
    buyCard.onclick = function () { selectTransaction('buy'); };
  }
  if (rentCard) {
    rentCard.onclick = function () { selectTransaction('rent'); };
  }
  if (qtyMinus) {
    qtyMinus.onclick = function () { updateQty(-1); };
  }
  if (qtyPlus) {
    qtyPlus.onclick = function () { updateQty(1); };
  }
  if (dayMinus) {
    dayMinus.onclick = function () { updateDuration(-1); };
  }
  if (dayPlus) {
    dayPlus.onclick = function () { updateDuration(1); };
  }
  if (addCartBtn) {
    addCartBtn.onclick = addToCart;
  }
  if (checkoutBtn) {
    checkoutBtn.onclick = checkoutVehicle;
  }
}

// frame utama (the vehicle selected on the catalog page)
function renderVehicle(vehicleData) {
  var container = document.getElementById('beliSewaContainer');
  var mainTpl = document.getElementById('beliSewaTemplate');

  currentVehicle = Object.assign({}, VEHICLE_FRAME, currentVehicle, vehicleData || {});
  trxState.units = 1;
  trxState.duration_days = 1;
  trxState.mode = 'buy';

  // clone template utama ke dalam #beliSewaContainer agar semua grid & tombol muncul
  if (container && mainTpl && mainTpl.content) {
    container.innerHTML = '';
    container.appendChild(mainTpl.content.cloneNode(true));
  }

  var titleEl = document.getElementById('pageTitle');
  if (titleEl && currentVehicle.nama) {
    titleEl.textContent = currentVehicle.nama + ' - Cache-Carry-Co.';
  }

  // frame gambar di dalam div.productImg
  var imgEl = document.getElementById('productImgEl');
  if (imgEl) {
    imgEl.src = currentVehicle.gambar || '';
    imgEl.alt = currentVehicle.nama || '';
  }

  // frame teks & harga
  var infoEl = document.getElementById('infoEl');
  if (infoEl) {
    infoEl.textContent = currentVehicle.info || '';
  }

  var nameEl = document.getElementById('productNameEl');
  if (nameEl) {
    nameEl.textContent = currentVehicle.nama || '';
  }

  var beliEl = document.getElementById('hargaBeli');
  if (beliEl) {
    beliEl.textContent = formatRupiah(currentVehicle.harga_beli);
  }

  var sewaEl = document.getElementById('hargaSewa');
  if (sewaEl) {
    sewaEl.textContent = formatRupiah(currentVehicle.harga_sewa);
  }

  renderSpecs(currentVehicle.specs);
  if (container) {
    bindBeliSewaEvents(container);
  }
  updateTransactionUI();
}

// tambah item ke cart
function addToCart() {
  var payload = {
    id: currentVehicle.id,
    nama: currentVehicle.nama,
    mode: trxState.mode,
    units: trxState.units,
    duration_days: trxState.mode === 'rent' ? trxState.duration_days : 1,
    subtotal: hitungTotalBeliSewa()
  };

  syncBeliSewaAction('add_to_cart', payload);
  showBeliSewaPopup((currentVehicle.nama || 'Vehicle') + ' added to cart');
}

// proses checkout langsung
function checkoutVehicle() {
  var payload = {
    id: currentVehicle.id,
    nama: currentVehicle.nama,
    mode: trxState.mode,
    units: trxState.units,
    duration_days: trxState.mode === 'rent' ? trxState.duration_days : 1,
    total: hitungTotalBeliSewa()
  };

  syncBeliSewaAction('checkout_vehicle', payload);
  showBeliSewaPopup('Processing ' + trxState.mode + ' order...');
}

var vehicleId = new URLSearchParams(window.location.search).get('id');
async function tampilkanDetail() {
  if (!vehicleId) return;

  var url = "beliSewa.php?id=" + encodeURIComponent(vehicleId);

  try {
    const response = await fetch(url);
    const result = await response.json();

    if(!response.ok || !result.success){
      throw new Error(result.message || "Failed to fetch data");
    }

    const kendaraan = result.data;

    renderVehicle({
          id: kendaraan.id_kendaraan,
          nama: kendaraan.nama,
          info: (kendaraan.merek || "-") + " • " + (kendaraan.tahun || "-"),
          gambar: kendaraan.foto,
          harga_beli: kendaraan.harga_jual,
          harga_sewa: kendaraan.harga_sewa,
          specs: [
              { value: kendaraan.merek || "-", label: "Brand" },
              { value: kendaraan.tahun || "-", label: "Year" },
              { value: kendaraan.kecepatan || "-", label: "Top Speed" }, 
              { value: kendaraan.kapasitas_penumpang || "-", label: "Capacity" }  
          ]
      });

  } catch (error) {
    console.error("Error: ", error);
  }
}

tampilkanDetail();

