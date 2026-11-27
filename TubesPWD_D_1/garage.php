<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/koneksi.php';

// Menyesuaikan nama variabel koneksi mysqli dari koneksi.php
$db = null;
if (isset($conn) && $conn instanceof mysqli) {
    $db = $conn;
} elseif (isset($koneksi) && $koneksi instanceof mysqli) {
    $db = $koneksi;
} elseif (isset($mysqli) && $mysqli instanceof mysqli) {
    $db = $mysqli;
}

if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Koneksi database mysqli tidak ditemukan.']);
    exit;
}

// Pastikan pengguna sudah login
if (!isset($_SESSION['id_pengguna'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

function formatImageUrl(?string $foto): string {
    if (!$foto) {
        return '';
    }
    if (strpos($foto, '../') === 0 || strpos($foto, 'http') === 0) {
        return $foto;
    }
    return '../TubesPWD_D_1/' . ltrim($foto, '/');
}

function formatTanggal(?string $datetime): string {
    if (!$datetime) {
        return '-';
    }
    $timestamp = strtotime($datetime);
    return $timestamp ? date('d M Y, H:i', $timestamp) : $datetime;
}

// =========================================================================
//        FITUR BUY AGAIN & RENT AGAIN -> MASUK KE $_SESSION['cart']
// =========================================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input) || ($input['action'] ?? '') !== 'reorder') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid request.']);
        exit;
    }

    $idKendaraan = (int) ($input['id_kendaraan'] ?? 0);
    $mode = $input['mode'] ?? '';

    if ($idKendaraan < 1 || !in_array($mode, ['buy', 'rent'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Data kendaraan atau mode transaksi tidak valid.']);
        exit;
    }

    // Cek keberadaan kendaraan dan sisa stok di database
    $stmt = $db->prepare('SELECT id_kendaraan, nama, stok_jual, stok_sewa FROM kendaraan WHERE id_kendaraan = ?');
    $stmt->bind_param('i', $idKendaraan);
    $stmt->execute();
    $vehicle = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$vehicle) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Kendaraan tidak ditemukan.']);
        exit;
    }

    if (!isset($_SESSION['cart']) || !is_array($_SESSION['cart'])) {
        $_SESSION['cart'] = [];
    }

    // Default unit = 1; jika item dengan mode yang sama sudah ada di cart, tambahkan 1 unit
    $targetUnits = 1;
    if (isset($_SESSION['cart'][$idKendaraan]) && ($_SESSION['cart'][$idKendaraan]['mode'] ?? '') === $mode) {
        $targetUnits = (int) $_SESSION['cart'][$idKendaraan]['units'] + 1;
    }

    $availableStock = ($mode === 'buy') ? (int) $vehicle['stok_jual'] : (int) $vehicle['stok_sewa'];

    if ($availableStock < 1) {
        $labelMode = ($mode === 'buy') ? 'pembelian' : 'penyewaan';
        echo json_encode([
            'success' => false,
            'message' => 'Maaf, stok ' . $labelMode . ' untuk ' . $vehicle['nama'] . ' sedang habis.'
        ]);
        exit;
    }

    if ($targetUnits > $availableStock) {
        echo json_encode([
            'success' => false,
            'message' => 'Stok ' . $vehicle['nama'] . ' tidak mencukupi (tersisa ' . $availableStock . ' unit, dan sudah ada di keranjangmu).'
        ]);
        exit;
    }

    // Simpan ke $_SESSION['cart'] sesuai format yang dibaca oleh cart.php
    $_SESSION['cart'][$idKendaraan] = [
        'id'            => $idKendaraan,
        'mode'          => $mode,
        'units'         => $targetUnits,
        'duration_days' => 1
    ];

    echo json_encode([
        'success'  => true,
        'message'  => 'Berhasil ditambahkan ke keranjang.',
        'redirect' => 'cart.xhtml'
    ]);
    exit;
}

// =========================================================================
//                 AMBIL DATA ORDERS, RENTALS, & HISTORY
// =========================================================================
$idPengguna = (int) $_SESSION['id_pengguna'];
$category = $_GET['category'] ?? 'orders';

$allowedCategories = ['orders', 'rentals', 'history'];
if (!in_array($category, $allowedCategories, true)) {
    $category = 'orders';
}

$results = [];

// 1. TAB ACTIVE ORDERS: tabel pembelian dengan status != 'done'
if ($category === 'orders') {
    $sql = "SELECT 
                p.id_pembelian AS order_id,
                p.tanggal_beli AS raw_date,
                p.alamat_pengiriman AS location,
                p.status,
                dp.jumlah,
                dp.sub_total AS price,
                k.id_kendaraan,
                k.nama,
                k.foto
            FROM pembelian p
            INNER JOIN detail_pembelian dp ON p.id_pembelian = dp.id_pembelian
            INNER JOIN kendaraan k ON dp.id_kendaraan = k.id_kendaraan
            WHERE p.id_pengguna = ? AND p.status != 'done'
            ORDER BY p.tanggal_beli DESC, dp.id_detail ASC";

    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $idPengguna);
    $stmt->execute();
    $res = $stmt->get_result();

    while ($row = $res->fetch_assoc()) {
        $namaKendaraan = $row['nama'] . ((int)$row['jumlah'] > 1 ? ' (x' . (int)$row['jumlah'] . ')' : '');
        $results[] = [
            'id_kendaraan'     => (int) $row['id_kendaraan'],
            'category'         => 'orders',
            'transaction_type' => 'Purchased',
            'name'             => $namaKendaraan,
            'location'         => $row['location'],
            'formatted_date'   => formatTanggal($row['raw_date']),
            'status'           => ucfirst($row['status']),
            'price'            => (int) $row['price'],
            'image_url'        => formatImageUrl($row['foto'])
        ];
    }
    $stmt->close();
}

// 2. TAB ACTIVE RENTALS: tabel penyewaan dengan status != 'done'
elseif ($category === 'rentals') {
    $sql = "SELECT 
                s.id_penyewaan AS order_id,
                s.tanggal_sewa AS raw_date,
                s.alamat_pengiriman AS location,
                s.status,
                ds.jumlah,
                ds.jumlah_hari,
                ds.sub_total AS price,
                k.id_kendaraan,
                k.nama,
                k.foto
            FROM penyewaan s
            INNER JOIN detail_penyewaan ds ON s.id_penyewaan = ds.id_penyewaan
            INNER JOIN kendaraan k ON ds.id_kendaraan = k.id_kendaraan
            WHERE s.id_pengguna = ? AND s.status != 'done'
            ORDER BY s.tanggal_sewa DESC, ds.id_detail ASC";

    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $idPengguna);
    $stmt->execute();
    $res = $stmt->get_result();

    while ($row = $res->fetch_assoc()) {
        $namaKendaraan = $row['nama'] . ((int)$row['jumlah'] > 1 ? ' (x' . (int)$row['jumlah'] . ')' : '');
        $results[] = [
            'id_kendaraan'     => (int) $row['id_kendaraan'],
            'category'         => 'rentals',
            'transaction_type' => 'Rented',
            'name'             => $namaKendaraan,
            'location'         => $row['location'],
            'formatted_date'   => formatTanggal($row['raw_date']),
            'status'           => ucfirst($row['status']),
            'price'            => (int) $row['price'],
            'image_url'        => formatImageUrl($row['foto'])
        ];
    }
    $stmt->close();
}

// 3. TAB HISTORY: gabungan pembelian & penyewaan yang statusnya = 'done'
elseif ($category === 'history') {
    $tempHistory = [];

    // Ambil dari pembelian (status = 'done')
    $sqlBeli = "SELECT 
                    p.tanggal_beli AS raw_date,
                    p.alamat_pengiriman AS location,
                    p.status,
                    dp.jumlah,
                    dp.sub_total AS price,
                    k.id_kendaraan,
                    k.nama,
                    k.foto
                FROM pembelian p
                INNER JOIN detail_pembelian dp ON p.id_pembelian = dp.id_pembelian
                INNER JOIN kendaraan k ON dp.id_kendaraan = k.id_kendaraan
                WHERE p.id_pengguna = ? AND p.status = 'done'";

    $stmtBeli = $db->prepare($sqlBeli);
    $stmtBeli->bind_param('i', $idPengguna);
    $stmtBeli->execute();
    $resBeli = $stmtBeli->get_result();

    while ($row = $resBeli->fetch_assoc()) {
        $namaKendaraan = $row['nama'] . ((int)$row['jumlah'] > 1 ? ' (x' . (int)$row['jumlah'] . ')' : '');
        $tempHistory[] = [
            'raw_date'         => $row['raw_date'],
            'id_kendaraan'     => (int) $row['id_kendaraan'],
            'category'         => 'history',
            'transaction_type' => 'Purchased',
            'name'             => $namaKendaraan,
            'location'         => $row['location'],
            'formatted_date'   => formatTanggal($row['raw_date']),
            'status'           => ucfirst($row['status']),
            'price'            => (int) $row['price'],
            'image_url'        => formatImageUrl($row['foto'])
        ];
    }
    $stmtBeli->close();

    // Ambil dari penyewaan (status = 'done')
    $sqlSewa = "SELECT 
                    s.tanggal_sewa AS raw_date,
                    s.alamat_pengiriman AS location,
                    s.status,
                    ds.jumlah,
                    ds.sub_total AS price,
                    k.id_kendaraan,
                    k.nama,
                    k.foto
                FROM penyewaan s
                INNER JOIN detail_penyewaan ds ON s.id_penyewaan = ds.id_penyewaan
                INNER JOIN kendaraan k ON ds.id_kendaraan = k.id_kendaraan
                WHERE s.id_pengguna = ? AND s.status = 'done'";

    $stmtSewa = $db->prepare($sqlSewa);
    $stmtSewa->bind_param('i', $idPengguna);
    $stmtSewa->execute();
    $resSewa = $stmtSewa->get_result();

    while ($row = $resSewa->fetch_assoc()) {
        $namaKendaraan = $row['nama'] . ((int)$row['jumlah'] > 1 ? ' (x' . (int)$row['jumlah'] . ')' : '');
        $tempHistory[] = [
            'raw_date'         => $row['raw_date'],
            'id_kendaraan'     => (int) $row['id_kendaraan'],
            'category'         => 'history',
            'transaction_type' => 'Rented',
            'name'             => $namaKendaraan,
            'location'         => $row['location'],
            'formatted_date'   => formatTanggal($row['raw_date']),
            'status'           => ucfirst($row['status']),
            'price'            => (int) $row['price'],
            'image_url'        => formatImageUrl($row['foto'])
        ];
    }
    $stmtSewa->close();

    // Urutkan gabungan riwayat dari transaksi paling baru
    usort($tempHistory, function ($a, $b) {
        return strtotime($b['raw_date']) <=> strtotime($a['raw_date']);
    });

    foreach ($tempHistory as $item) {
        unset($item['raw_date']);
        $results[] = $item;
    }
}

echo json_encode($results);