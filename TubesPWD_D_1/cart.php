<?php 
    require_once "koneksi.php";

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

            $stmt = mysqli_prepare($conn, "SELECT id_kendaraan, nama, merek, tahun, foto, harga_jual, harga_sewa
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

                $_SESSION['cart'][$id]['mode'] = $mode;
                break;

            case "update_qty":
                $id = (int)$input['id'] ?? '';
                $units = (int)($input['units'] ?? 0);

                if (!isset($_SESSION['cart'][$id]) || $units < 1) {
                    response([
                        "success" => false,
                        "message" => "Invalid quantity"
                    ]);
                }

                $_SESSION['cart'][$id]['units'] = $units;
                break;
            
            case "update_duration":
                $id = $input['id'] ?? '';
                $units = (int)($input['duration_days'] ?? 0);

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
            
            case "remove_select":
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

                foreach ($ids as $id) {
                    $id = (int)$id;
                    
                    if (isset($_SESSION['cart'][$id])) {
                        $selectedItems[] = $_SESSION['cart'][$id];
                    }
                }

                if (count($selectedItems) === 0) {
                    response(["success" => false, "message" => "No valid item"]);
                }

                $_SESSION['checkout_cart'] = $selectedItems;

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