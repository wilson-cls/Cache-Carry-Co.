<?php
/*
 * How to use:
 * 1. Pastikan sudah import 'cache_carry_co.sql' di phpMyAdmin
 * 2. Buka 'index.xhtml' lewat localhost (seperti demo biasa)
 * 3. Ganti 'index.xhtml' di URL browser menjadi 'setup_seed.php', lalu tekan Enter
 * 4. Jika muncul pesan sukses, ganti kembali URL ke 'login.xhtml' dan silakan login
 *
 * Akun Demo:
 * - User 1 -> username: user  | password: password
 * - User 2 -> username: user2 | password: password
 */

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/koneksi.php';

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
    echo json_encode(['success' => false, 'message' => 'Koneksi database mysqli gagal.']);
    exit;
}

// Menggunakan Nowdoc (<<<'SQL') agar tanda $ di hash password tidak dianggap variabel PHP
$sql = <<<'SQL'
-- 1. Data User
INSERT IGNORE INTO `pengguna` (`id_pengguna`, `username`, `nama`, `email`, `password`, `nomor_telepon`, `alamat_default`, `role`) VALUES
(50, 'user', 'Aheng', 'aheng@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '081234567890', 'Bulan, Luar Angkasa.', 'user'),
(51, 'user2', 'Ahong', 'ahong@cachecarry.co', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '081298765432', 'Dermaga Marina Ancol, Jakarta Utara', 'user');

-- 2. Data Pembelian
INSERT IGNORE INTO `pembelian` (`id_pembelian`, `id_pengguna`, `tanggal_beli`, `alamat_pengiriman`, `total_harga`, `status`) VALUES
(51, 50, '2026-11-25 14:30:00', 'Sirkuit Mandalika, Lombok', 34000000000, 'proceed'),
(52, 50, '2026-11-20 09:15:00', 'Dermaga Marina Ancol, Jakarta', 6600000000, 'sent'),
(53, 50, '2026-11-10 09:30:00', 'Jl. Sudirman No. 10, Jakarta Pusat', 58000000000, 'done'),
(54, 50, '2026-11-05 11:45:00', 'Bandara Halim Perdanakusuma, Jakarta', 182000000000, 'done'),
(55, 51, '2026-11-24 10:00:00', 'Pelabuhan Tanjung Benoa, Bali', 1070000000000, 'proceed'),
(56, 51, '2026-11-08 15:20:00', 'Helipad SCBD, Jakarta Selatan', 132000000000, 'done');

INSERT IGNORE INTO `detail_pembelian` (`id_detail`, `id_pembelian`, `id_kendaraan`, `jumlah`, `harga_satuan`, `sub_total`) VALUES
(51, 51, 11, 1, 34000000000, 34000000000),
(52, 52, 5, 1, 6600000000, 6600000000),
(53, 53, 1, 1, 58000000000, 58000000000),
(54, 54, 3, 1, 182000000000, 182000000000),
(55, 55, 8, 1, 1070000000000, 1070000000000),
(56, 56, 2, 1, 132000000000, 132000000000);

-- 3. Data Penyewaan
INSERT IGNORE INTO `penyewaan` (`id_penyewaan`, `id_pengguna`, `tanggal_sewa`, `tanggal_mulai`, `alamat_pengiriman`, `total_harga`, `status`) VALUES
(51, 50, '2026-11-26 11:00:00', '2026-12-01', 'Pelabuhan Benoa, Bali', 450000000, 'proceed'),
(52, 50, '2026-11-19 16:20:00', '2026-11-23', 'Jl. Asia Afrika No. 25, Bandung', 40000000, 'sent'),
(53, 50, '2026-11-12 10:00:00', '2026-11-14', 'Helipad Kuningan, Jakarta Selatan', 450000000, 'done'),
(54, 50, '2026-11-02 08:30:00', '2026-11-03', 'Labuan Bajo, Nusa Tenggara Timur', 300000000, 'done'),
(55, 51, '2026-11-21 13:10:00', '2026-11-25', 'Pantai Mutiara, Jakarta Utara', 300000000, 'sent');

INSERT IGNORE INTO `detail_penyewaan` (`id_detail`, `id_penyewaan`, `id_kendaraan`, `jumlah`, `jumlah_hari`, `harga_satuan`, `sub_total`) VALUES
(51, 51, 6, 1, 3, 150000000, 450000000),
(52, 52, 12, 1, 5, 8000000, 40000000),
(53, 53, 1, 1, 3, 150000000, 450000000),
(54, 54, 9, 1, 2, 150000000, 300000000),
(55, 55, 6, 1, 2, 150000000, 300000000);
SQL;

if ($db->multi_query($sql)) {
    do {
        if ($result = $db->store_result()) {
            $result->free();
        }
    } while ($db->more_results() && $db->next_result());

    if ($db->errno) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Terjadi error saat menjalankan seed: ' . $db->error
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Seed data berhasil dimasukkan! Silakan kembali ke login.xhtml.',
        'akun_demo' => [
            ['username' => 'user', 'nama' => 'Aheng', 'password' => 'password'],
            ['username' => 'user2', 'nama' => 'Ahong', 'password' => 'password']
        ]
    ], JSON_PRETTY_PRINT);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengeksekusi query seed: ' . $db->error
    ]);
}