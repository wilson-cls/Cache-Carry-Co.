<?php 
    require_once "koneksi.php";
    require_once __DIR__ . "/guard.php";

    header('Content-Type: application/json; charset=utf-8');

    if(!isset($_SESSION['cart'])) {
        $_SESSION['cart'] = [];
    }

    function response($data) {
        echo json_encode($data);
        exit;
    }

    // mengambil seluruh data cart
    if($_SERVER['REQUEST_METHOD'] === 'GET') {
        $items = [];

        foreach($_SESSION['cart'] as $cartItem) {
            $id = (int)$cartItem['id'];

            $stmt = mysqli_prepare($conn, "SELECT id_kendaraan, nama, merek, tahun, foto, harga_jual, harga_sewa, stok_jual, stok_sewa
                                           FROM kendaraan
                                           WHERE id_kendaraan = ?");
            
            mysqli_stmt_bind_param($stmt, "i", $id);
            mysqli_stmt_execute($stmt);

            $vehicle = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

            if ($vehicle) {
                $items[] = [
                    "id" => (int)$vehicle['id_kendaraan'],
                    "nama" => $vehicle['nama'],
                    "info" => $vehicle['merek'] . " • " . $vehicle['tahun'],
                    "gambar" => $vehicle['foto'],
                    "harga_beli" => (float)$vehicle['harga_jual'],
                    "harga_sewa" => (float)$vehicle['harga_sewa'],
                    "stok_jual" => (int)$vehicle['stok_jual'],
                    "stok_sewa" => (int)$vehicle['stok_sewa'],
                    "mode" => $cartItem['mode'],
                    "units" => (int)$cartItem['units'],
                    "duration_days" => (int)$cartItem['duration_days']
                ];
            }

            mysqli_stmt_close($stmt);
        }

        response([
            "success" => true,
            "items" => $items
        ]);
    }

    // menerima perubahan dari cart js
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);

        if (!is_array($input)) {
            response([
                "success" => false,
                "message" => "Invalid data"
            ]);
        }

        $action = $input['action'] ?? '';

        // cari posisi item dalam session cart
        function cariIndexCart($id) {
            foreach ($_SESSION['cart'] as $index => $item) {
                if((string)$item['id'] === (string)$id) {
                    return $index;
                }
            } 
            return -1;
        }

        switch ($action) {
            case "update_mode":
                $id = $input['id'] ?? '';
                $mode = $input['mode'] ?? '';

                if (!isset($_SESSION['cart'][$id]) ||
                    !in_array($mode, ['buy', 'rent'], true)) {

                    response([
                        "success" => false,
                        "message" => "Invalid item"
                    ]);
                }

                if($mode === 'buy'){
                    $kolomStok = "stok_jual";
                } else {
                    $kolomStok = "stok_sewa";
                }

                // Ambil stok terbaru dari database
                $stmt = mysqli_prepare($conn, "SELECT $kolomStok FROM kendaraan WHERE id_kendaraan = ?");

                mysqli_stmt_bind_param($stmt, "i", $id);
                mysqli_stmt_execute($stmt);

                $result = mysqli_stmt_get_result($stmt);
                $vehicle = mysqli_fetch_assoc($result);

                mysqli_stmt_close($stmt);

                if (!$vehicle || (int)$vehicle[$kolomStok] < 1) {
                    response([
                        "success" => false,
                        "message" => "This vehicle is out of stock"
                    ]);
                }

                // simpan mode baru
                $_SESSION['cart'][$id]['mode'] = $mode;

                // Sesuaikan quantity jika melebihi stok
                $stok = (int)$vehicle[$kolomStok];

                if ($_SESSION['cart'][$id]['units'] > $stok) {
                    $_SESSION['cart'][$id]['units'] = $stok;
                }
                break;

            case "update_qty":
                $id = (int)($input['id'] ?? 0);
                $units = (int)($input['units'] ?? 0);

                if (!isset($_SESSION['cart'][$id]) || $units < 1) {
                    response([
                        "success" => false,
                        "message" => "Invalid quantity"
                    ]);
                }

                $mode = $_SESSION['cart'][$id]['mode'];

                if($mode === 'buy') {
                    $kolomStok = "stok_jual";
                } else {
                    $kolomStok = "stok_sewa";
                }

                $stmt = mysqli_prepare($conn,"SELECT $kolomStok FROM kendaraan WHERE id_kendaraan = ?");

                mysqli_stmt_bind_param($stmt, "i", $id);
                mysqli_stmt_execute($stmt);

                $result = mysqli_stmt_get_result($stmt);
                $vehicle = mysqli_fetch_assoc($result);

                mysqli_stmt_close($stmt);

                if (!$vehicle || $units > (int)$vehicle[$kolomStok]) {
                    response([
                        "success" => false,
                        "message" => "Quantity exceeds available stock"
                    ]);
                }

                $_SESSION['cart'][$id]['units'] = $units;
                break;
            
            case "update_duration":
                $id = $input['id'] ?? '';
                $days = (int)($input['duration_days'] ?? 0);

                if (!isset($_SESSION['cart'][$id]) || $days < 1) {
                    response([
                        "success" => false,
                        "message" => "Invalid duration"
                    ]);
                }

                $_SESSION['cart'][$id]['duration_days'] = $days;
                break;
            
            case "remove_item":
                $id = $input['id'] ?? '';

                unset($_SESSION['cart'][$id]);
                break;
            
            case "remove_selected":
                $ids = $input['ids'] ?? '';

                if(!is_array($ids)) {
                    response(["success" => false, "message" => "Invalid IDs"]);
                }

                foreach ($ids as $id) {
                    unset($_SESSION['cart'][(int)$id]);
                }
                break;
            
            case "checkout":
                $ids = $input['ids'] ?? '';

                if(!is_array($ids) || count($ids) === 0) {
                    response(["success" => false, "message" => "No items selected"]);
                }

                $selectedItems = [];
                $selectedIds = [];

                foreach ($ids as $id) {
                    $id = (int)$id;

                    if($id < 1) {
                        response([
                            "success" => false,
                            "message" => "Invalid vehicle ID"
                        ]);
                    }

                    if (in_array($id, $selectedIds, true)) {
                        continue;
                    }

                    if (!isset($_SESSION['cart'][$id])) {
                        response([
                            "success" => false,
                            "message" => "Some selected vehicles are invalid"
                        ]);
                    }

                    $cartItem = $_SESSION['cart'][$id];

                     // Validasi data cart
                    $mode = $cartItem['mode'] ?? '';
                    $units = (int)($cartItem['units'] ?? 0);
                    $days = (int)($cartItem['duration_days'] ?? 0);

                    if (!in_array($mode, ['buy', 'rent'], true) || $units < 1 || $days < 1) {
                        response([
                            "success" => false,
                            "message" => "Invalid cart item data"
                        ]);
                    }

                    // Simpan data dalam format yang dibaca checkout.php
                    $selectedItems[] = [
                        "id" => $id,
                        "mode" => $mode,
                        "units" => $units,
                        "duration_days" => $days
                    ];

                    $selectedIds[] = $id;
                }

                if (count($selectedItems) === 0) {
                    response(["success" => false, "message" => "No valid item"]);
                }

                unset($_SESSION['checkout']); //hapus checkout langsung
                $_SESSION['checkout_cart'] = $selectedItems; //simpan item yang dipilih untuk checkout

                response([
                    "success" => true,
                    "message" => "Checkout prepared",
                    "redirect" => "checkout.xhtml"
                ]);
            
            default:
                response(["success" => false, "message" => "Unknown action"]);
        }

        response([
            "success" => true,
            "message" => "Cart updated"
        ]);
    }
?>