<?php
require_once 'koneksi.php';
$conn = mysqli_connect("localhost", "root", "", "");

$sql = "SELECT k.id, k.slug, k.mode, k.units, k.duration_days,
               v.nama, v.info, v.gambar, v.harga_beli, v.harga_sewa
        FROM keranjang k
        JOIN kendaraan v ON k.slug = v.slug
        ORDER BY k.id DESC";

$result = mysqli_query($conn, $sql);
$items = [];

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $items[] = [
            'id'            => (int) $row['id'],
            'slug'          => $row['slug'],
            'nama'          => $row['nama'],
            'info'          => $row['info'],
            'gambar'        => $row['gambar'],
            'mode'          => ($row['mode'] === 'rent') ? 'rent' : 'buy',
            'units'         => max(1, (int) $row['units']),
            'duration_days' => max(1, (int) $row['duration_days']),
            'harga_beli'    => (int) $row['harga_beli'],
            'harga_sewa'    => (int) $row['harga_sewa'],
        ];
    }
}

$dom = new DOMDocument('1.0', 'UTF-8');
$dom->preserveWhiteSpace = false;
$dom->formatOutput = true;
$dom->load('cart.xhtml');

$titleEl = $dom->getElementById('pageTitle');
if ($titleEl) {
    $titleEl->nodeValue = 'Cart (' . count($items) . ') - Cache-Carry-Co.';
}

$selectTextEl = $dom->getElementById('selectAllText');
if ($selectTextEl) {
    $selectTextEl->nodeValue = 'Select All Vehicles (0 of ' . count($items) . ')';
}

// Pastikan link Cart di navbar mengarah ke cart.php
$navMenu = $dom->getElementById('navMenu');
if ($navMenu) {
    $links = $navMenu->getElementsByTagName('a');
    foreach ($links as $a) {
        if (strtolower(trim($a->nodeValue)) === 'cart') {
            $a->setAttribute('href', 'cart.php');
        }
    }
}

// Menyisipkan data awal dari SQL ke window.INITIAL_CART_ITEMS sebelum cart.js dijalankan
$jsonData = json_encode($items, JSON_UNESCAPED_UNICODE);
$scriptNode = $dom->createElement('script');
$scriptNode->setAttribute('type', 'text/javascript');
$scriptNode->appendChild($dom->createTextNode('window.INITIAL_CART_ITEMS = ' . $jsonData . ';'));

$bodyList = $dom->getElementsByTagName('body');
if ($bodyList->length > 0) {
    $bodyList->item(0)->insertBefore($scriptNode, $bodyList->item(0)->firstChild);
}

echo $dom->saveXML();
?>