<?php
require_once __DIR__ .'/guard.php';

$error = '';
$old = [
    'email' => '',
    'nomor_telepon' => '',
    'alamat_default' => '',
    'username' => '',
];

// Jika user sudah login, redirect ke index.php
if(is_logged_in()){
    header('Location: ./index.php');
    exit;
}


// Ini untuk proses register
if($_SERVER['REQUEST_METHOD'] === 'POST'){
    $email = trim($_POST['email'] ?? '');
    $nomorTelepon = trim($_POST['nomor_telepon'] ??'');
    $alamatDefault = trim($_POST['alamat_default'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ??''; // Password engga di trim karena, well bisa saja user sengaja mau passowrdnya aneh
    $nama = $username;

    $old = [
        'email'=> $email,
        'nomor_telepon' => $nomorTelepon,
        'alamat_default' => $alamatDefault,
        'username'=> $username
    ];


    // Validasi input
    if($email === '' || $username === '' || $password === ''){
        $error = 'Email, Username, dan Password harus diisi'; // Bisa dibuat lebih spesifik nanti, but for now its enough
    } elseif(!filter_var($email, FILTER_VALIDATE_EMAIL)){
        $error = 'Email tidak valid! Masukkan alamat Email yang valid';
    } elseif(strlen($password) < 8){
        $error = 'Password minimal berjumlah 8 karakter';
    }else{
        $checkStmt = mysqli_prepare(
            $conn,
            'SELECT id_pengguna FROM pengguna WHERE username = ? OR email = ? LIMIT 1' //limit 1 karena yang penting cari apakah ada saja.
        );
        mysqli_stmt_bind_param($checkStmt, 'ss', $username, $email);
        mysqli_stmt_execute($checkStmt);
        mysqli_stmt_store_result($checkStmt);

        if(mysqli_stmt_num_rows($checkStmt) > 0){
            $error = 'Username atau Email sudah digunakan';
        }else{
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $phoneParam = $nomorTelepon !== '' ? $nomorTelepon : null; // Jika nomor telepon kosong, set ke null. Yang lain juga sama
            $addressParam = $alamatDefault !== '' ? $alamatDefault : null;
            $role = 'user'; //Default role, kalau perlu admin bisa nanti

            $insertStmt = mysqli_prepare(
                $conn,
                'INSERT INTO pengguna (username, nama, email, password, nomor_telepon, alamat_default, role)
                VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            
            mysqli_stmt_bind_param(
                $insertStmt,
                'sssssss', // Tipe data untuk masing-masing parameter: s = string, kalau i = integer, dll
                $username,
                $nama,
                $email,
                $hashedPassword,
                $phoneParam,
                $addressParam,
                $role
            );

            if(mysqli_stmt_execute($insertStmt)){
                session_regenerate_id(true); // Untuk mencegah session fixation
                $_SESSION['id_pengguna'] = mysqli_insert_id($conn);
                $_SESSION['username'] = $username;
                $_SESSION['nama'] = $nama;
                $_SESSION['role'] = $role;

                $_SESSION['flash_success'] = 'Registrasi berhasil! Silakan login menggunakan akun Anda.';
                header('Location: ./login.php');
                exit;
            }
            $error = 'Gagal membuat akun. Silahkan coba lagi nanti';
        }

        mysqli_stmt_close($checkStmt);
        if(isset($insertStmt) && $insertStmt instanceof mysqli_stmt){
            mysqli_stmt_close($insertStmt);
        }
    }
}

?>


<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="id" lang="id">
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />

    <!-- buka jalur koneksi lebih awal ke server Google Fonts sebelum file font-nya diunduh -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <!-- mengunduh file font Plus Jakarta Sans -->
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet" />

    <link rel="stylesheet" href="../Cache-Carry-Co. PWD-D/css/style.css" />
    <link rel="stylesheet" href="../Cache-Carry-Co. PWD-D/css/login_signIn.css" /> <!-- IMPORTANT ini css login, bukan register, but you can change it.-->
    <link rel="icon" type="image/svg+xml" href="../Cache-Carry-Co. PWD-D/images/Logo.svg" />
    <title>Login - Cache-Carry-Co.</title>
</head>

<body>
<!-- ======================== REGISTER PAGE ======================== -->
   <div id="login-page">
        <div class="login-container">
            <div class="image-section">
                <img src="../Cache-Carry-Co. PWD-D/images/login-hero.svg" alt="Image" />
            </div>

            <div class="login-section">
                <div class="judul">
                    <span><img src="../Cache-Carry-Co. PWD-D/images/Logo.svg" alt="Image" /></span>
                    <h2>Cache-Carry-Co.</h2>
                </div>

                <div class="welcome-header">
                    <h1>WELCOME</h1>
                </div>

                <?php if ($error !== ''): ?>
                    <p class="error-message"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></p>
                <?php endif; ?>

                <div id="form-utama">
                    <form action="../Cache-Carry-Co. PWD-D/register.php" method="post">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" value="<?php echo htmlspecialchars($old['email'], ENT_QUOTES, 'UTF-8'); ?>" />
                        </div>

                        <div class="form-group">
                            <label for="nomor_telepon">Phone Number</label>
                            <input type="number" id="nomor_telepon" name="nomor_telepon" value="<?php echo htmlspecialchars($old['nomor_telepon'], ENT_QUOTES, 'UTF-8'); ?>" />
                        </div>

                        <div class="form-group">
                            <label for="alamat_default">Default Address</label>
                            <input type="text" id="alamat_default" name="alamat_default" value="<?php echo htmlspecialchars($old['alamat_default'], ENT_QUOTES, 'UTF-8'); ?>" />
                        </div>

                        <div class="form-group">
                            <label for="username">Username</label>
                            <input type="text" id="username" name="username" value="<?php echo htmlspecialchars($old['username'], ENT_QUOTES, 'UTF-8'); ?>" />
                        </div>

                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" name="password" />
                        </div>

                        <div class="button-group">
                            <input type="submit" value="Register" />
                        </div>

                        <p class="signup">
                            Sudah Punya Akun?
                            <a href="../Cache-Carry-Co. PWD-D/login.php">Login</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script src="./js/script.js"></script>
</body>

</html>
