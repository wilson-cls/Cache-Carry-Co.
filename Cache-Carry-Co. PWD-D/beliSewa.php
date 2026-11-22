<?php
require_once 'koneksi.php';
$conn = mysqli_connect("localhost", "root", "", "");

$slug = isset($_GET['id']) ? trim($_GET['id']) : 'sunreef-80-power';
if ($slug === '') {
    $slug = 'sunreef-80-power';
}

$stmt = mysqli_prepare(
    $conn,
    'SELECT slug, nama, info, gambar, penumpang, kecepatan, jarak, wifi, harga_beli, harga_sewa
     FROM kendaraan
     WHERE slug = ?
     LIMIT 1'
);
mysqli_stmt_bind_param($stmt, 's', $slug);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$kendaraan = $result ? mysqli_fetch_assoc($result) : null;

// Fallback jika slug tidak ditemukan di database
if (!$kendaraan) {
    $fallbackRes = mysqli_query(
        $conn,
        'SELECT slug, nama, info, gambar, penumpang, kecepatan, jarak, wifi, harga_beli, harga_sewa
         FROM kendaraan
         LIMIT 1'
    );
    $kendaraan = $fallbackRes ? mysqli_fetch_assoc($fallbackRes) : null;
}

if (!$kendaraan) {
    $kendaraan = [
        'slug'       => 'sunreef-80-power',
        'nama'       => 'Sunreef 80 Power',
        'info'       => 'Laut - 2022',
        'gambar'     => '../Cache-Carry-Co. PWD-D/images/Kendaraan Laut/Sunreef 80 Power.svg',
        'penumpang'  => '8 - 12',
        'kecepatan'  => '20 - 25 kn',
        'jarak'      => '3,000+ nm',
        'wifi'       => 'Wi-Fi',
        'harga_beli' => 95000000000,
        'harga_sewa' => 200000000,
    ];
}

function formatRupiahPhp($angka) {
    return 'Rp ' . number_format((float) $angka, 0, ',', '.');
}

$dom = new DOMDocument('1.0', 'UTF-8');
$dom->preserveWhiteSpace = false;
$dom->formatOutput = true;
$dom->load('beliSewa.xhtml');

$setText = function ($id, $text) use ($dom) {
    $el = $dom->getElementById($id);
    if ($el) {
        $el->nodeValue = (string) $text;
    }
};

$setText('pageTitle', $kendaraan['nama'] . ' - Cache-Carry-Co.');
$setText('infoEl', $kendaraan['info']);
$setText('productNameEl', $kendaraan['nama']);
$setText('specPenumpang', $kendaraan['penumpang']);
$setText('specKecepatan', $kendaraan['kecepatan']);
$setText('specJarak', $kendaraan['jarak']);
$setText('specWifi', $kendaraan['wifi']);
$setText('hargaBeli', formatRupiahPhp($kendaraan['harga_beli']));
$setText('hargaSewa', formatRupiahPhp($kendaraan['harga_sewa']));

$imgEl = $dom->getElementById('productImgEl');
if ($imgEl) {
    $imgEl->setAttribute('src', $kendaraan['gambar']);
    $imgEl->setAttribute('alt', $kendaraan['nama']);
}

// Arahkan link Cart di navbar ke cart.php
$navMenu = $dom->getElementById('navMenu');
if ($navMenu) {
    $links = $navMenu->getElementsByTagName('a');
    foreach ($links as $a) {
        if (strtolower(trim($a->nodeValue)) === 'cart') {
            $a->setAttribute('href', 'cart.php');
        }
    }
}

// Sisipkan window.CURRENT_VEHICLE_SLUG agar beliSewa.js mengirim slug ke cart_action.php
$slugScript = $dom->createElement('script');
$slugScript->setAttribute('type', 'text/javascript');
$slugScript->appendChild(
    $dom->createTextNode(
        'window.CURRENT_VEHICLE_SLUG = ' . json_encode($kendaraan['slug'], JSON_UNESCAPED_UNICODE) . ';'
    )
);

$bodyList = $dom->getElementsByTagName('body');
if ($bodyList->length > 0) {
    $bodyList->item(0)->insertBefore($slugScript, $bodyList->item(0)->firstChild);
}

echo $dom->saveXML();
?>