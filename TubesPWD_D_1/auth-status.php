
<?php
    require_once 'koneksi.php';
    header('Content-Type: application/json; charset=utf-8');
    if(isset($_SESSION['id_pengguna'])){
        $id = $_SESSION['id_pengguna'];
        $query = mysqli_prepare($conn,
            "SELECT username, nama, email, nomor_telepon,
                    alamat_default AS address, password, role
            FROM pengguna
            WHERE id_pengguna = ?"
        );
        mysqli_stmt_bind_param($query, "i", $id);
        mysqli_stmt_execute($query);
        $result = mysqli_stmt_get_result($query);
        $user = mysqli_fetch_assoc($result);
        if ($user) {
            echo json_encode([
                'isLoggedIn' => true,
                'id' => $id,
                'username' => $user['username'],
                'nama' => $user['nama'],
                'email' => $user['email'],
                'nomor_telepon' => $user['nomor_telepon'],
                'address' => $user['address'],
                'role' => $user['role'],
                'password' => $user['password']
            ]);
        }else{
            echo json_encode([
                'isLoggedIn' => false
            ]);
        }
    }else{
        echo json_encode([
            'isLoggedIn' => false
        ]);
    }
?>
