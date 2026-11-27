<?php 
    require_once "koneksi.php";

    header('Content-Type: application/json; charset=utf-8');

    function keluar($data, $code = 200) {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }

    if(!isset($_SESSION['id_pengguna'])) {
        keluar(["success" => false, "message" => "Please sign in first"], 401);
    }

    $idUser = intval($_SESSION['id_pengguna']);

    $daftarCheckout = [];
    $sumberCheckout = "";

    //checkout dari halaman beli/sewa
    if(isset($_SESSION['checkout'])){
         $co = $_SESSION['checkout'];

         $daftarCheckout[] = [
            "id_kendaraan" => (int) $co['id_kendaraan'],
            "mode" => $co['mode'],
            "units" => (int) $co['units'],
            "duration_days" => (int) ($co['days'] ?? 1)
         ];

         $sumberCheckout = "direct";
         //Checkout dari cart
    } elseif (isset($_SESSION['checkout_cart'])) {
        foreach($_SESSION['checkout_cart'] as $cartItem) {
            $daftarCheckout[] = [
                "id_kendaraan" => (int) $cartItem['id'],
                "mode" => $cartItem['mode'],
                "units" => (int) $cartItem['units'],
                "duration_days" => (int) ($cartItem['duration_days'])
            ];
        }

        $sumberCheckout = "cart";
    } else {
        keluar([
            "success" => false,
            "message" => "No checkout data"
        ], 401);
    }
   
    if(count($daftarCheckout) === 0) {
        keluar([
            "success" => false,
            "message" => "Checkout cart is empty"
        ], 400);
    }

    // Ambil kendaraan dan hitung harga
    $items = [];
    $subtotal = 0;

    foreach($daftarCheckout as $item) {
        $idKendaraan = $item['id_kendaraan'];
        $mode = $item['mode'];
        $units = $item['units'];
        $days = $item['duration_days'];

        // validasi data
        if ($idKendaraan <= 0 || $units <= 0) {
            keluar([
                "success" => false,
                "message" => "Invalid vehicle or quantity"
            ], 400);
        }

        if (!in_array($mode, ["buy", "rent"], true)) {
            keluar([
                "success" => false,
                "message" => "Invalid vehicle mode"
            ], 400);
        }

        // Ambil data kendaraan dari database
        $stmt = mysqli_prepare(
            $conn,
            "SELECT * FROM kendaraan WHERE id_kendaraan = ?"
        );

        mysqli_stmt_bind_param($stmt, "i", $idKendaraan);
        mysqli_stmt_execute($stmt);

        $k = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

        if (!$k) {
            keluar([
                "success" => false,
                "message" => "Vehicle not found"
            ], 404);
        }

        // Tentukan harga berdasarkan mode
        $isRent = ($mode === "rent");

        if ($isRent) {
            $harga = (float) $k['harga_sewa'];
            $days = max(1, $days);
            $total = $harga * $units * $days;
        } else {
            $harga = (float) $k['harga_jual'];
            $days = 0;
            $total = $harga * $units;
        }

        // Tentukan kategori kendaraan
        $kategori = [
            1 => "Air",
            2 => "Sea",
            3 => "Land"
        ];

        $tipe = ($kategori[$k['id_kategori']] ?? "Vehicle")
            . "-"
            . ($isRent ? "Rent" : "Buy");

        $unitText = $units . " unit";

        if ($isRent) {
            $unitText .= " x " . $days . " day(s)";
        }

        // Masukkan kendaraan ke daftar item
        $items[] = [
            "id_kendaraan" => (int) $k['id_kendaraan'],
            "image" => $k['foto'],
            "name" => $k['nama'],
            "type" => $tipe,
            "origin" => $k['merek'],
            "price" => $total,
            "unit" => $unitText,
            "mode" => $mode,
            "units" => $units,
            "duration_days" => $days
        ];

        $subtotal += $total;
    }


    // Data penerima
    $stmt = mysqli_prepare($conn, "SELECT username, alamat_default FROM pengguna WHERE id_pengguna = ?");
    mysqli_stmt_bind_param($stmt, "i", $idUser);
    mysqli_stmt_execute($stmt);
    $user = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

    if(!$user) {
        keluar(["success" => false, "message" => "User not found"], 404);
    }

    if($_SERVER['REQUEST_METHOD'] === 'GET') {
        keluar([
            "success" => true,
            "source" => $sumberCheckout,
            "recipient_name" => $user['username'],
            "recipient_address" => $user['alamat_default'],
            "items" => $items,
            "subtotal" => $subtotal,
            "grand_total" => $subtotal
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

        $alamat = trim($in['alamat_pengiriman'] ?? '');

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