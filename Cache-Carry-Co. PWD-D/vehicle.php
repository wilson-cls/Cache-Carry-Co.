<?php
    require_once "koneksi.php";

    header('Content-Type: application/json; charset=utf-8');

    $kategori = isset($_GET['kategori']) ? $_GET['kategori'] : "all";

    if($kategori == "1") {
        $sql = "SELECT * FROM kendaraan WHERE id_kategori = 1";
    } else if($kategori == "2") {
        $sql = "SELECT * FROM kendaraan WHERE id_kategori = 2";
    } else if ($kategori == "3") {
        $sql = "SELECT * FROM kendaraan WHERE id_kategori = 3";
    } else if ($kategori == "1,2") {
        $sql = "SELECT * FROM kendaraan WHERE id_kategori = 1 OR id_kategori = 2";
    } else if ($kategori == "1,3") {
        $sql = "SELECT * FROM kendaraan WHERE id_kategori = 1 OR id_kategori = 3";
    } else if ($kategori == "2,3") {
        $sql = "SELECT * FROM kendaraan WHERE id_kategori = 2 OR id_kategori = 3";
    } else {
        $sql = "SELECT * FROM kendaraan";
    }

    $query = mysqli_query($conn, $sql);

    $data = [];

    while($row = mysqli_fetch_assoc($query)){
        $data[] = $row;
    }

    echo json_encode([
        "success" => true,
        "data" => $data
    ])
?>