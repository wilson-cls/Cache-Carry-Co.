<?php 
    require_once "koneksi.php";
    require_once __DIR__ . "/guard.php";

    header('Content-Type: application/json; charset=utf-8');

    function response($data) {
        echo json_encode($data);
        exit;
    }

    // mengambil seluruh data cart
    if($_SERVER['REQUEST_METHOD'] === 'GET') {
        $idUser = (int)$_SESSION['id_pengguna'];

        $items = [];

        $stmt = mysqli_prepare($conn, "SELECT k.id_kendaraan, k.nama, k.merek, k.tahun, k.foto, k.harga_jual, k.harga_sewa, k.stok_jual, k.stok_sewa, c.tipe, c.jumlah, c.jumlah_hari
            FROM keranjang c
            JOIN kendaraan k
                ON c.id_kendaraan = k.id_kendaraan
            WHERE c.id_pengguna = ?
        ");

        mysqli_stmt_bind_param($stmt, "i", $idUser);
        mysqli_stmt_execute($stmt);

        $result = mysqli_stmt_get_result($stmt);

        while ($vehicle = mysqli_fetch_assoc($result)) {

            $items[] = [
                "id" => (int)$vehicle['id_kendaraan'],
                "nama" => $vehicle['nama'],
                "info" => $vehicle['merek'] . " • " . $vehicle['tahun'],
                "gambar" => $vehicle['foto'],
                "harga_beli" => (float)$vehicle['harga_jual'],
                "harga_sewa" => (float)$vehicle['harga_sewa'],
                "stok_jual" => (int)$vehicle['stok_jual'],
                "stok_sewa" => (int)$vehicle['stok_sewa'],
                "mode" => $vehicle['tipe'],
                "units" => (int)$vehicle['jumlah'],
                "duration_days" => (int)$vehicle['jumlah_hari']
            ];
        }

        mysqli_stmt_close($stmt);

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

        $idUser = (int)$_SESSION['id_pengguna'];

        $action = $input['action'] ?? '';

        switch ($action) {
            // Mengubah mode Buy atau Rent
            case "update_mode":
                $id = (int)($input['id'] ?? 0);
                $mode = $input['mode'] ?? '';

                if ($id < 1 || !in_array($mode, ['buy', 'rent'], true)) {
                    response([
                        "success" => false,
                        "message" => "Invalid item"
                    ]);
                }

                if ($mode === 'buy') {
                    $kolomStok = "stok_jual";
                } else {
                    $kolomStok = "stok_sewa";
                }

                // Periksa stok kendaraan
                $stmt = mysqli_prepare($conn, "
                    SELECT $kolomStok
                    FROM kendaraan
                    WHERE id_kendaraan = ?
                ");

                mysqli_stmt_bind_param($stmt, "i", $id);
                mysqli_stmt_execute($stmt);

                $vehicle = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
                mysqli_stmt_close($stmt);

                if (!$vehicle || (int)$vehicle[$kolomStok] < 1) {
                    response([
                        "success" => false,
                        "message" => "This vehicle is out of stock"
                    ]);
                }

                // Ambil jumlah kendaraan saat ini
                $stmt = mysqli_prepare($conn, "
                    SELECT jumlah
                    FROM keranjang
                    WHERE id_kendaraan = ? AND id_pengguna = ?
                ");

                mysqli_stmt_bind_param($stmt, "ii", $id, $idUser);
                mysqli_stmt_execute($stmt);

                $cartItem = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
                mysqli_stmt_close($stmt);

                if (!$cartItem) {
                    response([
                        "success" => false,
                        "message" => "Cart item not found"
                    ]);
                }

                $units = min((int)$cartItem['jumlah'], (int)$vehicle[$kolomStok]);

                // Simpan mode dan jumlah baru
                $stmt = mysqli_prepare($conn, "
                    UPDATE keranjang
                    SET tipe = ?, jumlah = ?
                    WHERE id_kendaraan = ? AND id_pengguna = ?
                ");

                mysqli_stmt_bind_param($stmt, "siii", $mode, $units, $id, $idUser);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);

                break;


            // Mengubah jumlah kendaraan
            case "update_qty":
                $id = (int)($input['id'] ?? 0);
                $units = (int)($input['units'] ?? 0);

                if ($id < 1 || $units < 1) {
                    response([
                        "success" => false,
                        "message" => "Invalid quantity"
                    ]);
                }

                // Cari mode kendaraan di cart milik user
                $stmt = mysqli_prepare($conn, "
                    SELECT tipe
                    FROM keranjang
                    WHERE id_kendaraan = ? AND id_pengguna = ?
                ");

                mysqli_stmt_bind_param($stmt, "ii", $id, $idUser);
                mysqli_stmt_execute($stmt);

                $cartItem = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
                mysqli_stmt_close($stmt);

                if (!$cartItem) {
                    response([
                        "success" => false,
                        "message" => "Cart item not found"
                    ]);
                }

                if ($cartItem['tipe'] === 'buy') {
                    $kolomStok = "stok_jual";
                } else {
                    $kolomStok = "stok_sewa";
                }

                // Periksa stok
                $stmt = mysqli_prepare($conn, "
                    SELECT $kolomStok
                    FROM kendaraan
                    WHERE id_kendaraan = ?
                ");

                mysqli_stmt_bind_param($stmt, "i", $id);
                mysqli_stmt_execute($stmt);

                $vehicle = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
                mysqli_stmt_close($stmt);

                if (!$vehicle || $units > (int)$vehicle[$kolomStok]) {
                    response([
                        "success" => false,
                        "message" => "Quantity exceeds available stock"
                    ]);
                }

                // Simpan jumlah baru
                $stmt = mysqli_prepare($conn, "
                    UPDATE keranjang
                    SET jumlah = ?
                    WHERE id_kendaraan = ? AND id_pengguna = ?
                ");

                mysqli_stmt_bind_param($stmt, "iii", $units, $id, $idUser);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
                break;


            // Mengubah durasi sewa
            case "update_duration":
                $id = (int)($input['id'] ?? 0);
                $days = (int)($input['duration_days'] ?? 0);

                if ($id < 1 || $days < 1) {
                    response([
                        "success" => false,
                        "message" => "Invalid duration"
                    ]);
                }

                // make sure item rental milik user memang ada
                $stmt = mysqli_prepare($conn, "
                    SELECT id_keranjang
                    FROM keranjang
                    WHERE id_kendaraan = ?
                    AND id_pengguna = ?
                    AND tipe = 'rent'
                ");

                mysqli_stmt_bind_param($stmt, "ii", $id, $idUser);
                mysqli_stmt_execute($stmt);

                $cartItem = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
                mysqli_stmt_close($stmt);

                if (!$cartItem) {
                    response([
                        "success" => false,
                        "message" => "Rental cart item not found"
                    ]);
                }

                // Perbarui durasi
                $stmt = mysqli_prepare($conn, "
                    UPDATE keranjang
                    SET jumlah_hari = ?
                    WHERE id_kendaraan = ?
                    AND id_pengguna = ?
                    AND tipe = 'rent'
                ");

                mysqli_stmt_bind_param($stmt, "iii", $days, $id, $idUser);

                if (!mysqli_stmt_execute($stmt)) {
                    mysqli_stmt_close($stmt);

                    response([
                        "success" => false,
                        "message" => "Failed to update rental duration"
                    ]);
                }

                mysqli_stmt_close($stmt);
                break;


            // Menghapus satu kendaraan
            case "remove_item":
                $id = (int)($input['id'] ?? 0);

                $stmt = mysqli_prepare($conn, "
                    DELETE FROM keranjang
                    WHERE id_kendaraan = ? AND id_pengguna = ?
                ");

                mysqli_stmt_bind_param($stmt, "ii", $id, $idUser);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);

                break;


            // Menghapus beberapa kendaraan
            case "remove_selected":
                $ids = $input['ids'] ?? [];

                if (!is_array($ids) || count($ids) === 0) {
                    response([
                        "success" => false,
                        "message" => "Invalid IDs"
                    ]);
                }

                $stmt = mysqli_prepare($conn, "
                    DELETE FROM keranjang
                    WHERE id_kendaraan = ? AND id_pengguna = ?
                ");

                foreach ($ids as $id) {
                    $id = (int)$id;

                    if ($id > 0) {
                        mysqli_stmt_bind_param($stmt, "ii", $id, $idUser);
                        mysqli_stmt_execute($stmt);
                    }
                }

                mysqli_stmt_close($stmt);
                break;
            
            case "checkout":
                $ids = $input['ids'] ?? [];

                if (!is_array($ids) || count($ids) === 0) {
                    response([
                        "success" => false,
                        "message" => "No items selected"
                    ]);
                }

                $selectedItems = [];
                $selectedIds = [];

                foreach ($ids as $id) {

                    $id = (int)$id;

                    if ($id < 1) {
                        response([
                            "success" => false,
                            "message" => "Invalid vehicle ID"
                        ]);
                    }

                    // Hindari ID kendaraan yang sama diproses dua kali
                    if (in_array($id, $selectedIds, true)) {
                        continue;
                    }

                    // Ambil item dari database milik user yang sedang login
                    $stmt = mysqli_prepare($conn, "
                        SELECT id_kendaraan, tipe, jumlah, jumlah_hari
                        FROM keranjang
                        WHERE id_kendaraan = ? AND id_pengguna = ?
                    ");

                    mysqli_stmt_bind_param($stmt, "ii", $id, $idUser);
                    mysqli_stmt_execute($stmt);

                    $cartItem = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
                    mysqli_stmt_close($stmt);

                    if (!$cartItem) {
                        response([
                            "success" => false,
                            "message" => "Some selected vehicles are invalid"
                        ]);
                    }

                    // Ambil data dari database
                    $mode = $cartItem['tipe'];
                    $units = (int)$cartItem['jumlah'];
                    $days = (int)$cartItem['jumlah_hari'];

                    // Validasi data cart
                    if (!in_array($mode, ['buy', 'rent'], true) ||
                        $units < 1 || $days < 1) {

                        response([
                            "success" => false,
                            "message" => "Invalid cart item data"
                        ]);
                    }

                    // Simpan dalam format yang dibaca checkout.php
                    $selectedItems[] = [
                        "id" => (int)$cartItem['id_kendaraan'],
                        "mode" => $mode,
                        "units" => $units,
                        "duration_days" => $days
                    ];

                    $selectedIds[] = $id;
                }

                if (count($selectedItems) === 0) {
                    response([
                        "success" => false,
                        "message" => "No valid item"
                    ]);
                }

                // Hapus data checkout langsung sebelumnya
                unset($_SESSION['checkout']);

                // Simpan item terpilih untuk proses checkout
                $_SESSION['checkout_cart'] = $selectedItems;

                response([
                    "success" => true,
                    "message" => "Checkout prepared",
                    "redirect" => "checkout.xhtml"
                ]);
                break;

            default:
                response([
                    "success" => false,
                    "message" => "Unknown action"
                ]);
        }

        response([
            "success" => true,
            "message" => "Cart updated"
        ]);
    }
?>