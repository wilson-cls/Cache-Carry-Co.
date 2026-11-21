var currentType = 'buy';
var quantity = 1;
var durationDays = 1;

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

function updateQty(delta) {
  quantity += delta;
  if (quantity < 1) {
    quantity = 1;
  }
  document.getElementById('qtyCount').innerHTML = quantity;
}

function updateDuration(delta) {
  durationDays += delta;
  if (durationDays < 1) {
    durationDays = 1;
  }
  document.getElementById('durationCount').innerHTML = durationDays;
}