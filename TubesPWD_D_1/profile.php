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
        'message' => 'Your login session has ended. Please log in again.'
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
        echo json_encode(['success' => false, 'message' => 'User not found.']);
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
            'message' => 'User not found.'
        ]);
        exit;
    }

    $nama         = trim((string) ($input['nama'] ?? ''));
    $email        = trim((string) ($input['email'] ?? ''));
    $nomorTelepon = trim((string) ($input['nomor_telepon'] ?? ''));
    $address      = trim((string) ($input['address'] ?? ''));
    $password     = (string) ($input['password'] ?? '');
    $currentPassword = (string) ($input['current_password'] ?? '');

    // Validasi wajib isi untuk nama & email
    if ($nama === '' || $nama === '-') {
        echo json_encode([
            'success' => false,
            'message' => 'Name cant be empty.'
        ]);
        exit;
    }

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'success' => false,
            'error_type' => 'invalid_email',
            'message' => 'Invalid email format. Example: name@domain.com'
        ]);
        exit;
    }

    // cek password kalau biar tetap sesuai ama yang di register aturannya
    $updatePassword = false;
    $hashedPassword = '';
    if ($password !== '') {
        if (strlen($password) < 8) {
            echo json_encode([
                'success' => false,
                'message' => 'Password must be at least 8 characters long.'
            ]);
            exit;
        }

        if (trim($currentPassword) === ''){
            echo json_encode([
                'success' => false,
                'error_type' => 'invalid_current_password',
                'message' => 'Please enter your current password.'
            ]);
            exit;
        }

        // ambil hash password lama dari database
        $passwordStmt = mysqli_prepare($conn, "SELECT password from pengguna WHERE id_pengguna = ?");
        mysqli_stmt_bind_param($passwordStmt, 'i', $idPengguna);
        mysqli_stmt_execute($passwordStmt);

        $passwordResult = mysqli_fetch_assoc(mysqli_stmt_get_result($passwordStmt));

        mysqli_stmt_close($passwordStmt);

        // verifikasi password lama
        if(!$passwordResult || !password_verify($currentPassword, $passwordResult['password'])) {
            echo json_encode([
                'success' => false,
                'error_type' => 'wrong_current_password',
                'message' => 'Current password does not match.',
            ]);
            exit;
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $updatePassword = true;
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
            'message'    => 'Email "' . $email . '" already registered on another account. Please use a different email.'  //Messagenya ditampilin javascript default (diatas gitu) kalau email duplikat
        ]);
        
        exit;
    }

    // Jika telepon atau alamat kosong / "-", simpan NULL ke database
    $dbPhone   = ($nomorTelepon === '' || $nomorTelepon === '-') ? null : $nomorTelepon;
    $dbAddress = ($address === '' || $address === '-') ? null : $address;

    // cek pass ikut update atau ga
    if($updatePassword){
        $updateStmt = mysqli_prepare(
            $conn,
            "UPDATE pengguna
             SET nama = ?, email = ?, nomor_telepon = ?, alamat_default = ?, password = ?
             WHERE id_pengguna = ?"
        );
        mysqli_stmt_bind_param($updateStmt, 'sssssi', $nama, $email, $dbPhone, $dbAddress, $hashedPassword, $idPengguna);
    }else{
        $updateStmt = mysqli_prepare(
            $conn,
            "UPDATE pengguna
             SET nama = ?, email = ?, nomor_telepon = ?, alamat_default = ?
             WHERE id_pengguna = ?"
        );
        mysqli_stmt_bind_param($updateStmt, 'ssssi', $nama, $email, $dbPhone, $dbAddress, $idPengguna);
    }

    if (!mysqli_stmt_execute($updateStmt)) {
        mysqli_stmt_close($updateStmt);
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save profile changes.'
        ]);
        exit;
    }

    mysqli_stmt_close($updateStmt);

    echo json_encode([
        'success' => true,
        'message' => 'Profile successfully updated.',
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
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);