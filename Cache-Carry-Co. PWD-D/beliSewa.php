<?php 
    session_start();
    require_once "koneksi.php";

    header('Content-Type: application/json; charset=utf-8');

    //post menyimpan data checkout
    if($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['action']) || $input['action'] !== 'checkout_vehicle') {
            echo json_encode([
                "success" => false,
                "message" => "Invalid action"
            ]);
            exit;
        }

        $id = intval($input['id_kendaraan'] ?? 0);
        $mode = $input['mode'] ?? 'buy';
        $units = intval($input['units'] ?? 1);
        $days = intval($input['duration_days'] ?? 1);

        $stmt = mysqli_prepare($conn, "SELECT id_kendaraan FROM kendaraan WHERE id_kendaraan = ?");
        mysqli_stmt_bind_param($stmt, "i", $id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $vehicle = mysqli_fetch_assoc($result);

        if (!$vehicle) {
            echo json_encode([
                "success" => false,
                "message" => "Vehicle not found"
            ]);
            exit;
        }

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