<?php 
    require_once "koneksi.php";

    header('Content-Type: application/json; charset=utf-8');

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