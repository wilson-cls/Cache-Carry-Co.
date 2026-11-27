<?php
    require_once __DIR__ . '/guard.php';


    $error = '';
    $oldUsername = '';
    $success = '';
    //udah login? langsung ke index.php, halaman utamanya
    if(is_logged_in()){
        header('Location: ./index.php');
        exit;
    }

    if(!empty($_SESSION['flash_success'])){
        $success = $_SESSION['flash_success'];
        unset($_SESSION['flash_success']);
    }
    
    
    if($_SERVER['REQUEST_METHOD'] === 'POST'){
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        $oldUsername = $username;

        if($username === '' || $password === ''){
            $error = 'Harap masukkan username dan password!';
        }else{
            $stmt = mysqli_prepare(
                $conn,
                'SELECT id_pengguna, username, nama, password, role 
                FROM pengguna
                WHERE username = ?
                LIMIT 1'
            );

            mysqli_stmt_bind_param($stmt, 's', $username);
            mysqli_stmt_execute($stmt);
            $result = mysqli_stmt_get_result($stmt);
            $user = $result ? mysqli_fetch_assoc($result) : null;
            mysqli_stmt_close($stmt);

            if($user && password_verify($password, $user['password'])){
                session_regenerate_id(true);
                $_SESSION['id_pengguna'] = (int) $user['id_pengguna'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['nama'] = $user['nama'];
                $_SESSION['role'] = $user['role'];

                header('Location: ./index.php'); // Ke page utama yaitu index.php, kalau perlu ubah ganti aja, aku lupa
                exit;
            }
            $error = 'Username atau Password Salah!';
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
<!-- ======================== LOGIN PAGE ======================== -->
    <div id="login-page">
        <div class="login-container">
            <div class="image-section">
                <img src="./images/login-hero.svg" alt="Image" />
            </div>

            <div class="login-section">
                <div class="judul">
                    <span><img src="./images/Logo.svg" alt="Image" /></span>
                    <h2>Cache-Carry-Co.</h2>
                </div>

                <div class="welcome-header">
                    <h1>WELCOME BACK</h1>
                    <p>Silahkan login menggunakan Akun yang sudah kamu daftarkan.</p>
                </div>

                <?php if ($error !== ''): ?>
                    <p class="error-message"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></p>
                <?php endif; ?>

                <div id="form-utama">
                    <form action="./login.php" method="post">
                        <div class="form-group">
                            <label for="username">Username</label>
                            <input type="text" id="username" name="username" value="<?php echo htmlspecialchars($oldUsername, ENT_QUOTES, 'UTF-8'); ?>" />
                        </div>

                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" name="password" />
                        </div>

                        <div class="button-group">
                            <input type="submit" value="Sign in" />
                        </div>

                        <p class="signup">
                            Tidak Punya Akun?
                            <a href="./register.php">Sign up</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script src="./js/script.js"></script>
</body>

</html>
