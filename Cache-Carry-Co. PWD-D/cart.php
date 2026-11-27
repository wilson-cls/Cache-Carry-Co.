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

                $index = cariIndexCart($id);

                if ($index === -1 || !in_array($mode, ['buy', 'rent'], true)) {
                    response(["success" => false, "message" => "Invalid item"]);
                }

                $_SESSION['cart'][$index]['mode'] = $mode;
                break;

            case "update_qty":
                $id = $input['id'] ?? '';
                $units = (int)($input['units'] ?? 0);

                $index = cariIndexCart($id);

                if ($index === -1 || $units < 1) {
                    response(["success" => false, "message" => "Invalid quantiy"]);
                }

                $_SESSION['cart'][$index]['units'] = $units;
                break;
            
            case "update_duration":
                $id = $input['id'] ?? '';
                $units = (int)($input['duration_days'] ?? 0);

                $index = cariIndexCart($id);
                
                if ($index === -1 || $$days < 1) {
                    response(["success" => false, "message" => "Invalid duration"]);
                }

                $_SESSION['cart'][$index]['duration_days'] = $days;
                break;
            
            case "remove_item":
                $id = $input['id'] ?? '';
                $index = cariIndexCart($id);

                if($index != -1){
                    array_splice($_SESSION['cart'], $index, 1);
                }
                break;
            
            case "remove_select":
                $ids = $input['ids'] ?? '';

                if(!is_array($ids)) {
                    response(["success" => false, "message" => "Invalid IDs"]);
                }

                $_SESSION['cart'] = array_values(array_filter(
                    $_SESSION['cart'],
                    function ($item) use ($ids) {
                        return !in_array(
                            (string)$item['id'],
                            array_map('strval', $ids),
                            true
                        );
                    }
                ));
                break;
            
            case "checkout":
                $ids = $input['ids'] ?? '';

                if(!is_array($ids) || count($ids) === 0) {
                    response(["success" => false, "message" => "No items selected"]);
                }

                $selectedItems = [];

                foreach ($_SESSION['cart'] as $item) {
                    if(in_array((string)$item['id'], array_map('strval', $ids), true)) {
                        $selectedItems[] = $item;
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