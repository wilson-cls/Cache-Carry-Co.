<?php 
    require_once "koneksi.php";

    header('Content-Type: application/json; charset=utf-8');

    // Mengambil 5 kendaraan terbaru
    $query = mysqli_query($conn,
        "SELECT id_kendaraan, nama, merek, tahun, foto,
                harga_jual, harga_sewa 
        FROM kendaraan
        ORDER BY tahun DESC
        LIMIT 5"
    );

    $data = [];

    if (!$query) {
        http_response_code(500);

        echo json_encode([
            "success" => false,
            "message" => "Query failed: " . mysqli_error($conn)
        ]);

        exit;
    }

    // Mengambil data satu per satu
    while ($row = mysqli_fetch_assoc($query)) {
        $row['harga_jual'] = formatRupiah($row['harga_jual']);
        $row['harga_sewa'] = formatRupiah($row['harga_sewa']);
        $data[] = $row;
    }

    // Mengirim hasil ke frontend
    echo json_encode([
        "success" => true,
        "data" => $data
    ]);
?>