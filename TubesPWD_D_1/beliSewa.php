<?php 
    require_once "koneksi.php";
    require_once __DIR__ . '/guard.php';

    header('Content-Type: application/json; charset=utf-8');

    //post menyimpan data checkout atau add to cart
    if($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        $action = $input['action'] ?? '';

        if (!is_logged_in()) {
            echo json_encode([
                "success" => false,
                "message" => "Please sign in first",
                "redirect" => "login.xhtml"
            ]);
            exit;
        }

        if(!is_array($input)) {
            echo json_encode([
                "success" => false,
                "message" => "Invalid request data"
            ]);
            exit;
        }

        $action = $input['action'] ?? '';

        $id = intval($input['id_kendaraan'] ?? 0);
        $mode = $input['mode'] ?? 'buy';
        $units = intval($input['units'] ?? 1);
        $days = intval($input['duration_days'] ?? 1);

        if($id < 1 || !in_array($mode, ['buy', 'rent'], true) || $units < 1 || $days < 1) {
            echo json_encode([
                "success" => false,
                "message" => "Invalid vehicle or transaction data"
            ]);
            exit;
        }

        // make sure data kendaraan ada
        $stmt = mysqli_prepare($conn, "SELECT id_kendaraan FROM kendaraan WHERE id_kendaraan = ?");
        mysqli_stmt_bind_param($stmt, "i", $id);
        mysqli_stmt_execute($stmt);
        
        $vehicle = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

        if (!$vehicle) {
            echo json_encode([
                "success" => false,
                "message" => "Vehicle not found"
            ]);
            exit;
        }

        // action 1: add to cart
        if ($action === 'add_to_cart') {
            if (!isset($_SESSION['cart'])) {
                $_SESSION['cart'] = [];
            }

            $_SESSION['cart'][$id] = [
                'id' => $id,
                'mode' => $mode,
                'units' => $units,
                'duration_days' => $days
            ];

            echo json_encode([
                "success" => true,
                "message" => "Vehicle added to cart"
            ]);

            exit;
        }

        // action 2: checkout langsung
        if($action === 'checkout_vehicle') {
             $_SESSION['checkout'] = [
            'id_kendaraan' => $id,
            'mode' => $mode,
            'units' => $units,
            'days' => $days
            ];

            echo json_encode([
                "success" => true,
                "message" => "Checkout data saved",
                "redirect" => "checkout.xhtml"
            ]);
            exit;
        }
    }

    //get mengambil detail kendaraan
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;

    $stmt = mysqli_prepare($conn, "SELECT * FROM kendaraan
            WHERE id_kendaraan = ?");

    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);
    $row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

    if ($row) {
        echo json_encode ([
            "success" => true,
            "data" => $row
        ]);
    } else {
         echo json_encode ([
            "success" => false,
            "message" => "Vehicle not found"
        ]);
    }

?>