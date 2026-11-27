<?php 
    require_once "koneksi.php";

    header('Content-Type: application/json; charset=utf-8');

    function keluar($data, $code = 200) {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }

    if(!isset($_SESSION['id_user'])) {
        keluar(["success" => false, "message" => "Please sign in first"], 401);
    }

    if(!isset($_SESSION['checkout'])) {
        keluar(["success" => false, "message" => "No checkout data"], 401);
    }

    $idUser = intval($_SESSION['id_user']);
    $co = $_SESSION['checkout'];

    // Ambil kendaraan dan hitung harga
    $stmt = mysqli_prepare($conn, "SELECT * FROM kendaraan WHERE id_kendaraan = ?");
    mysqli_stmt_bind_param($stmt, "i", $co['id_kendaraan']);
    mysqli_stmt_execute($stmt);

    $k = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

    if(!$k) {
        keluar(["success" => false, "message" => "Vehicle not found"], 404);
    }

    $isRent = ($co['mode'] === "rent");
    $harga = $isRent ? (float) $k['harga_sewa'] : (float)$k['harga_jual'];
    
    if ($isRent) {
        $total = $harga * $co['units'] * $co['days'];
    } else {
        $total = $harga * $co['units'];
    }
    // Data penerima
    $stmt = mysqli_prepare($conn, "SELECT username, alamat_default FROM pengguna WHERE id_user = ?");
    mysqli_stmt_bind_param($stmt, "i", $idUser);
    mysqli_stmt_execute($stmt);
    $user = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

    if(!$user) {
        keluar(["success" => false, "message" => "User not found"], 404);
    }

    if($_SERVER['REQUEST_METHOD'] === 'GET') {
        $kategori = [1 => "Air", 2 => "Sea", 3 => "Land"];
        $tipe = ($kategori[$k['id_kategori']] ?? "Vehicle") . "-" . ($isRent ? "Rent" : "Buy");
        $unitText = $co['units'] . " unit" . ($isRent ? " x " . $co['days'] . " day(s)" : "");

        keluar([
            "success" => true,
            "id_kendaraan" => (int)$k['id_kendaraan'],
            "recipient_name" => $user['username'],
            "recipient_address" => $user['alamat_default'],
            "items" => [[
                "id_kendaraan" => (int)$k['id_kendaraan'],
                "image" => $k['foto'],
                "name" => $k['nama'],
                "type" => $tipe,
                "origin" => $k['merek'],
                "price" => $total,
                "unit" => $unitText
            ]],
            "subtotal" => $total,
            "grand_total" => $total
        ]);
    }

    // place order
    if($_SERVER['REQUEST_METHOD'] === 'POST') {
        $in = json_decode(file_get_contents('php://input'), true);

        if(!is_array($in)) {
            $in = [];
        }

        if(($in['action'] ?? "") !== "place_order") {
            keluar(["success" => false, "message" => "Unknown action"]);
        }

        $alamat = trim($in['recipient_address'] ?? '');

        if($alamat === '') {
            $alamat = $user['alamat_default'];
        }

        $metode = $in['payment_method'] ?? "";
        if(!in_array($metode, ["credit_card", "debit"], true)) {
            keluar(["success" => false, "message" => "Invalid payment method"]);
        }

        $kolomStok = $isRent ? "stok_sewa" : "stok_jual";
        $units     = (int)$co['units'];
        $days      = (int)$co['days'];
        $idKend    = (int)$co['id_kendaraan'];
        $mode      = $co['mode'];
        $alamat    = $user['alamat_default'];

        mysqli_begin_transaction($conn);

        try {
            // kurangi stok hanya kalau stok masih cukup 
            $stmt = mysqli_prepare($conn,
                "UPDATE kendaraan SET $kolomStok = $kolomStok - ? WHERE id_kendaraan = ? AND $kolomStok >= ?");
            mysqli_stmt_bind_param($stmt, "iii", $units, $idKend, $units);
            mysqli_stmt_execute($stmt);

            if (mysqli_stmt_affected_rows($stmt) < 1) {
                throw new Exception("Stock is no longer sufficient");
            }

            // simpan pesanan
            $stmt = mysqli_prepare($conn,
                "INSERT INTO pembelian (id_user, id_kendaraan, mode, jumlah, durasi_hari, total, metode_pembayaran, alamat_pengiriman)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            mysqli_stmt_bind_param($stmt, "iisiidss",
                $idUser, $idKend, $mode, $units, $days, $total, $metode, $alamat);
            mysqli_stmt_execute($stmt);

            mysqli_commit($conn);
        } catch (Exception $e) {
            mysqli_rollback($conn);
            keluar(["success" => false, "message" => "Failed to place order: " . $e->getMessage()]);
        }

        unset($_SESSION['checkout']);

        // ganti tujuan sesuai halaman setelah order (misalnya garage / halaman sukses)
        keluar(["success" => true, "message" => "Order placed", "redirect" => "garage.xhtml"]);
    }

    keluar(["success" => false, "message" => "Method not allowed"], 405);
    
?>