<?php
    require_once "koneksi.php";

    header('Content-Type: application/json; charset=utf-8');

    $kategori = isset($_GET['kategori']) ? $_GET['kategori'] : "all";
    $sort     = isset($_GET['sort']) ? $_GET['sort'] : "nama-asc";
    $q = isset($_GET['q']) ? mysqli_real_escape_string($conn, trim($_GET['q'])) : "";

    // Filter data
    if($kategori == "1") {
        $sql = "SELECT * FROM kendaraan WHERE id_kategori = 1";
    } else if($kategori == "2") {
        $sql = "SELECT * FROM kendaraan WHERE id_kategori = 2";
    } else if ($kategori == "3") {
        $sql = "SELECT * FROM kendaraan WHERE id_kategori = 3";
    } else if ($kategori == "1,2") {
        $sql = "SELECT * FROM kendaraan WHERE (id_kategori = 1 OR id_kategori = 2)";
    } else if ($kategori == "1,3") {
        $sql = "SELECT * FROM kendaraan WHERE (id_kategori = 1 OR id_kategori = 3)";
    } else if ($kategori == "2,3") {
        $sql = "SELECT * FROM kendaraan WHERE (id_kategori = 2 OR id_kategori = 3)";
    } else {
        $sql = "SELECT * FROM kendaraan WHERE 1=1";
    }

    if($q !== "") {
        $sql .= " AND (nama LIKE '%$q%' OR merek LIKE '%$q%')";
    }

    // Sort data
    if ($sort == "nama-asc") {
        $sql .= " ORDER BY nama ASC";
    } else if ($sort == "nama-desc") {
        $sql .= " ORDER BY nama DESC";
    } else if ($sort == "price-asc") {
        $sql .= " ORDER BY harga_jual ASC";
    } else if ($sort == "price-desc") {
        $sql .= " ORDER BY harga_jual DESC";
    } else if ($sort == "year-asc") {
        $sql .= " ORDER BY tahun ASC";
    } else if ($sort == "year-desc") {
        $sql .= " ORDER BY tahun DESC";
    } 

    $query = mysqli_query($conn, $sql);

    $data = [];

    while($row = mysqli_fetch_assoc($query)){
        $row['harga_jual'] = formatRupiahSingkat($row['harga_jual']);
        $row['harga_sewa'] = formatRupiahSingkat($row['harga_sewa']);
        $data[] = $row;
    }

    echo json_encode([
        "success" => true,
        "data" => $data
    ])
?>