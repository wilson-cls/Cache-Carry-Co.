<?php
// PANGGIL session_start() di awal file PHP yang menggunakan session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/guard.php'; // Punya aheng

// Mengakses via metode POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ./login.xhtml');
    exit;
}

$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

if ($username === '' || $password === '') {
    // Kalau kosong balik ke login.xhtml dengan status error
    header('Location: ./login.xhtml?error=kosong');
    exit;
}

// Ambil data dari tabel 'pengguna'
$stmt = mysqli_prepare(
    $conn,
    'SELECT id_pengguna, username, nama, password, role 
    FROM pengguna
    WHERE username = ?
    LIMIT 1'
);

if ($stmt) {
    mysqli_stmt_bind_param($stmt, 's', $username);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $user = $result ? mysqli_fetch_assoc($result) : null;
    mysqli_stmt_close($stmt);

    // Verifikasi password dengan password_verify()
    if ($user && password_verify($password, $user['password'])) {
        // Buat session login baru yang aman
        session_regenerate_id(true);
        $_SESSION['id_pengguna'] = $user['id_pengguna'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['nama'] = $user['nama'];
        $_SESSION['role'] = $user['role'];

        // BERHASIL: Pindah ke index.xhtml
        header('Location: ./index.xhtml');
        exit;
    }
}

// GAGAL: Kembali ke halaman login dengan status error
header('Location: ./login.xhtml?error=salah');
exit;
?>