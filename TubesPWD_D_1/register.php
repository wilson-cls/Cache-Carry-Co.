<?php
    header('Content-Type: application/json');
    require_once __DIR__ .'/guard.php';

    $response = ['success' => false, 'message' => ''];
    if($_SERVER['REQUEST_METHOD'] !== 'POST'){
        $response['message'] = 'The request method is not valid';
        echo json_encode($response);
        exit;
    }
    $email = trim($_POST['email'] ?? '');
    $nomorTelepon  = trim($_POST['nomor_telepon'] ?? '');
    $alamatDefault = trim($_POST['alamat_default'] ?? '');
    $username      = trim($_POST['username'] ?? '');
    $password      = $_POST['password'] ?? '';
    $nama          = $username;

    //Cek Input
    if ($email === '' || $username === '' || $password === '') {
    $response['message'] = 'Email, Username, and Password must be filled in.';
    echo json_encode($response);
    exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response['message'] = 'Invalid email! Please enter a valid email address.';
        echo json_encode($response);
        exit;
    }

    if (strlen($password) < 8) {
        $response['message'] = 'Password must be at least 8 characters long.';
        echo json_encode($response);
        exit;
    }

    // cEK duplikasi
    $checkStmt = mysqli_prepare(
        $conn, 'SELECT id_pengguna FROM pengguna WHERE username = ? OR email = ? LIMIT 1'
    );
    mysqli_stmt_bind_param($checkStmt, 'ss', $username, $email);
    mysqli_stmt_execute($checkStmt);
    mysqli_stmt_store_result($checkStmt);

    if (mysqli_stmt_num_rows($checkStmt) > 0) {
        mysqli_stmt_close($checkStmt);
        $response['message'] = 'Username or Email is already taken.';
        echo json_encode($response);
        exit;
    }
    mysqli_stmt_close($checkStmt);

    // simpan data
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $phoneParam     = $nomorTelepon !== '' ? $nomorTelepon : null;
    $addressParam   = $alamatDefault !== '' ? $alamatDefault : null;
    $role           = 'user';

    $insertStmt = mysqli_prepare(
        $conn, 'INSERT INTO pengguna (username, nama, email, password, nomor_telepon, alamat_default, role)
        VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    mysqli_stmt_bind_param(
        $insertStmt,
        'sssssss',
        $username,
        $nama,
        $email,
        $hashedPassword,
        $phoneParam,
        $addressParam,
        $role
    );

    if (mysqli_stmt_execute($insertStmt)) {
        $response['success'] = true;
        $response['message'] = 'Registration successful! You can now log in.';
    } else {
        $response['message'] = 'Failed to create an account: ' . mysqli_error($conn);
    }

    mysqli_stmt_close($insertStmt);
    echo json_encode($response);
    exit;
?>
