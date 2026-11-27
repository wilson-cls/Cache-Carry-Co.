<?php
    require_once __DIR__ . '/koneksi.php';

    /*
    Include HANYA di halaman yang perlu login akun saja.
    Bedanya dengan koneksi.php, koneksi.php dipakai semua halaman untuk buka sama mulai session,
    sedangkan guard.php untuk memastikan user sudah Login di page yang diperlukan. 
    */

    function is_logged_in(): bool{
        return !empty($_SESSION['id_pengguna']);
    }

    function current_user_id(): ?int{
        return is_logged_in() ? (int) $_SESSION['id_pengguna'] : null;
    }

    function require_login(string $loginUrl = './login.php'): void{
        if (!is_logged_in()) {
            header("Location: {$loginUrl}");
            exit;
        }
    }
?>