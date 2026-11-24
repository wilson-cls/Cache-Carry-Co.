<?php 
    // diinclude oleh semua halaman
    session_start();
    
    $conn = mysqli_connect('localhost', 'root', '', 'cache_carry_co');

    if(!$conn) {
        die("Connection database failed: " . mysqli_connect_error());
    }

    // untuk kartu produk
    function formatRupiahSingkat($angka) {
        if($angka >= 1000000000000) {
            return 'IDR ' . rtrim(rtrim(number_format($angka / 1000000000000, 2, ',', '.'), '0'), ',') . ' T';
        } elseif($angka >= 1000000000) {
            return 'IDR ' . rtrim(rtrim(number_format($angka / 1000000000, 2, ',', '.'), '0'), ',') . ' B';
        } elseif ($angka >= 1000000) {
            return 'IDR ' . rtrim(rtrim(number_format($angka / 1000000, 2, ',', '.'), '0'), ',') . ' M';
        } 
        return 'IDR ' . number_format($angka, 0, ',', '.');
    }

    // format lengkap untuk detail / cart
    function formatRupiah($angka) {
        return 'IDR ' . number_format($angka, 0, ',', '.');
    }
?>

