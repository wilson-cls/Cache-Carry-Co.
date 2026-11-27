<?php
    session_start();
    header('Content-Type: application/json; charset=utf-8');
    if (isset($_SESSION['id_pengguna'])) {
        echo json_encode([
            'isLoggedIn' => true,
            'id' => $_SESSION['id_pengguna'],
            'username' => $_SESSION['username'],
            'nama' => $_SESSION['nama'],
            'role' => $_SESSION['role']
        ]);
    } else {
        echo json_encode([
            'isLoggedIn' => false
        ]);
    }
?>