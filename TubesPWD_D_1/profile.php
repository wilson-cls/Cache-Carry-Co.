<?php
require_once __DIR__ . '/koneksi.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

// Pastikan user sudah login
if (!isset($_SESSION['id_pengguna'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Sesi login berakhir. Silakan login kembali.'
    ]);
    exit;
}

$idPengguna = (int) $_SESSION['id_pengguna'];

// Untuk mengambil profil
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = mysqli_prepare(
        $conn,
        "SELECT username, nama, email, nomor_telepon, alamat_default AS address, role
         FROM pengguna
         WHERE id_pengguna = ?"
    );
    mysqli_stmt_bind_param($stmt, 'i', $idPengguna);
    mysqli_stmt_execute($stmt);
    $user = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    mysqli_stmt_close($stmt);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Pengguna tidak ditemukan.']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'data'    => $user
    ]);
    exit;
}

// Untuk update profil
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Format data tidak valid.'
        ]);
        exit;
    }

    $nama         = trim((string) ($input['nama'] ?? ''));
    $email        = trim((string) ($input['email'] ?? ''));
    $nomorTelepon = trim((string) ($input['nomor_telepon'] ?? ''));
    $address      = trim((string) ($input['address'] ?? ''));

    // Validasi wajib isi untuk nama & email
    if ($nama === '' || $nama === '-') {
        echo json_encode([
            'success' => false,
            'message' => 'Nama tidak boleh kosong.'
        ]);
        exit;
    }

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'success' => false,
            'error_type' => 'invalid_email',
            'message' => 'Format email tidak valid. Contoh: nama@domain.com'
        ]);
        exit;
    }

    // Cek apakah email sudah dipakai akun lain (karena kolom email UNIQUE di DB)
    $checkStmt = mysqli_prepare(
        $conn,
        "SELECT id_pengguna FROM pengguna WHERE email = ? AND id_pengguna != ?"
    );
    mysqli_stmt_bind_param($checkStmt, 'si', $email, $idPengguna);
    mysqli_stmt_execute($checkStmt);
    $existing = mysqli_fetch_assoc(mysqli_stmt_get_result($checkStmt));
    mysqli_stmt_close($checkStmt);

    // Error kalau emailnya duplikat
    if ($existing) {
        echo json_encode([
            'success'    => false,
            'error_type' => 'duplicate_email',
            'message'    => 'Email "' . $email . '" sudah terdaftar pada akun lain. Silakan gunakan email yang berbeda.'  //Messagenya ditampilin javascript default (diatas gitu) kalau email duplikat
        ]);
        
        exit;
    }

    // Jika telepon atau alamat kosong / "-", simpan NULL ke database
    $dbPhone   = ($nomorTelepon === '' || $nomorTelepon === '-') ? null : $nomorTelepon;
    $dbAddress = ($address === '' || $address === '-') ? null : $address;

    // Update data tanpa mengubah username
    $updateStmt = mysqli_prepare(
        $conn,
        "UPDATE pengguna
         SET nama = ?, email = ?, nomor_telepon = ?, alamat_default = ?
         WHERE id_pengguna = ?"
    );
    mysqli_stmt_bind_param($updateStmt, 'ssssi', $nama, $email, $dbPhone, $dbAddress, $idPengguna);

    if (!mysqli_stmt_execute($updateStmt)) {
        mysqli_stmt_close($updateStmt);
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Gagal menyimpan perubahan profil.'
        ]);
        exit;
    }

    mysqli_stmt_close($updateStmt);

    echo json_encode([
        'success' => true,
        'message' => 'Profil berhasil diperbarui.',
        'data'    => [
            'nama'          => $nama,
            'email'         => $email,
            'nomor_telepon' => $dbPhone ?? '-',
            'address'       => $dbAddress ?? '-'
        ]
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan.']);