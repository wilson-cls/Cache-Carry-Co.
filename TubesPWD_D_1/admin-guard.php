<?php
    // file admin-guard.php harus diinclude di semua admin page
    require_once __DIR__ . '/koneksi.php';

    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // Pastikan sudah login
    if (!isset($_SESSION['id_pengguna'])) {
        header('Location: login.xhtml');
        exit;
    }

    // Periksa role langsung dari database
    $idPengguna = (int) $_SESSION['id_pengguna'];

    $stmt = mysqli_prepare(
        $conn,
        "SELECT role FROM pengguna WHERE id_pengguna = ?"
    );

    mysqli_stmt_bind_param($stmt, 'i', $idPengguna);
    mysqli_stmt_execute($stmt);

    $result = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

    mysqli_stmt_close($stmt);

    // Tolak akses jika bukan Admin
    if (!$result || $result['role'] !== 'admin') {
        http_response_code(403);
        exit('Access denied. Admin only.');
    }

?>