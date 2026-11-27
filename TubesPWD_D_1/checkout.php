<?php 
    require_once "koneksi.php";

    header('Content-Type: application/json; charset=utf-8');

    function keluar($data, $code = 200) {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }

    if(!isset($_SESSION['id_pengguna'])) {
        keluar(["success" => false, "message" => "Please sign in first"], 401);
    }

    $idUser = intval($_SESSION['id_pengguna']);

    $daftarCheckout = [];
    $sumberCheckout = "";

    //checkout dari halaman beli/sewa
    if(isset($_SESSION['checkout'])){
         $co = $_SESSION['checkout'];

         $daftarCheckout[] = [
            "id_kendaraan" => (int) $co['id_kendaraan'],
            "mode" => $co['mode'],
            "units" => (int) $co['units'],
            "duration_days" => (int) ($co['days'] ?? 1)
         ];

         $sumberCheckout = "direct";
         //Checkout dari cart
    } elseif (isset($_SESSION['checkout_cart'])) {
        foreach($_SESSION['checkout_cart'] as $cartItem) {
            $daftarCheckout[] = [
                "id_kendaraan" => (int) $cartItem['id'],
                "mode" => $cartItem['mode'],
                "units" => (int) $cartItem['units'],
                "duration_days" => (int) ($cartItem['duration_days'])
            ];
        }

        $sumberCheckout = "cart";
    } else {
        keluar([
            "success" => false,
            "message" => "No checkout data"
        ], 401);
    }
   
    if(count($daftarCheckout) === 0) {
        keluar([
            "success" => false,
            "message" => "Checkout cart is empty"
        ], 400);
    }

    // Ambil kendaraan dan hitung harga
    $items = [];
    $subtotal = 0;

    foreach($daftarCheckout as $item) {
        $idKendaraan = $item['id_kendaraan'];
        $mode = $item['mode'];
        $units = $item['units'];
        $days = $item['duration_days'];

        // validasi data
        if ($idKendaraan <= 0 || $units <= 0) {
            keluar([
                "success" => false,
                "message" => "Invalid vehicle or quantity"
            ], 400);
        }

        if (!in_array($mode, ["buy", "rent"], true)) {
            keluar([
                "success" => false,
                "message" => "Invalid vehicle mode"
            ], 400);
        }

        // Ambil data kendaraan dari database
        $stmt = mysqli_prepare(
            $conn,
            "SELECT * FROM kendaraan WHERE id_kendaraan = ?"
        );

        mysqli_stmt_bind_param($stmt, "i", $idKendaraan);
        mysqli_stmt_execute($stmt);

        $k = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

        if (!$k) {
            keluar([
                "success" => false,
                "message" => "Vehicle not found"
            ], 404);
        }

        // Tentukan harga berdasarkan mode
        $isRent = ($mode === "rent");

        if ($isRent) {
            $harga = (float) $k['harga_sewa'];
            $days = max(1, $days);
            $total = $harga * $units * $days;
        } else {
            $harga = (float) $k['harga_jual'];
            $days = 0;
            $total = $harga * $units;
        }

        // Tentukan kategori kendaraan
        $kategori = [
            1 => "Air",
            2 => "Sea",
            3 => "Land"
        ];

        $tipe = ($kategori[$k['id_kategori']] ?? "Vehicle")
            . "-"
            . ($isRent ? "Rent" : "Buy");

        $unitText = $units . " unit";

        if ($isRent) {
            $unitText .= " x " . $days . " day(s)";
        }

        // Masukkan kendaraan ke daftar item
        $items[] = [
            "id_kendaraan" => (int) $k['id_kendaraan'],
            "image" => $k['foto'],
            "name" => $k['nama'],
            "type" => $tipe,
            "origin" => $k['merek'],
            "price" => $total,
            "unit" => $unitText,
            "mode" => $mode,
            "units" => $units,
            "duration_days" => $days,
            "harga_satuan" => $harga,
            "subtotal" => $total
        ];

        $subtotal += $total;
    }


    // Data penerima
    $stmt = mysqli_prepare($conn, "SELECT username, alamat_default FROM pengguna WHERE id_pengguna = ?");
    mysqli_stmt_bind_param($stmt, "i", $idUser);
    mysqli_stmt_execute($stmt);
    $user = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

    if(!$user) {
        keluar(["success" => false, "message" => "User not found"], 404);
    }

    if($_SERVER['REQUEST_METHOD'] === 'GET') {
        keluar([
            "success" => true,
            "source" => $sumberCheckout,
            "recipient_name" => $user['username'],
            "recipient_address" => $user['alamat_default'],
            "items" => $items,
            "subtotal" => $subtotal,
            "grand_total" => $subtotal
        ]);
    }

    // place order
    if($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || ($data['action'] ?? '') !== 'place_order') {
            keluar([
                "success" => false,
                "message" => "Request is not valid."
            ], 400);
        }

        $alamat = trim($data['alamat_pengiriman'] ?? '');

        if($alamat === '') {
            $alamat = $user['alamat_default'];
        }

        if($alamat == '') {
            keluar([
                "success" => false,
                "message" => "Shipping address is required"
            ], 400);
        } 

        // ambil tanggal setiap kendaraan dari js
        $tanggalItems = $data['items'] ?? [];

        // buat daftar tanggal berdasarkan id kendaraan
        $tanggalPerKendaraan = [];

        foreach($tanggalItems as $tanggalItem) {
            $id = (int) ($tanggalItem['id_kendaraan'] ?? 0);

            if($id > 0) {
                $tanggalPerKendaraan[$id] = [
                    'tanggal_mulai' => $tanggalItem['start_date'] ?? '',
                    'jumlah_hari' => (int) ($tanggalItem['duration_days'] ?? 0)
                ];
            }
        }

        mysqli_begin_transaction($conn);

        try {
            $totalPembelian = 0;
            $totalPenyewaan = 0;

            $daftarBeli = [];
            $daftarSewa = [];

            foreach($items as $item) {
                if($item['mode'] === 'buy') {
                    $daftarBeli[] = $item;
                } else {
                    $daftarSewa[] = $item;
                }
            }
           
            //transaksi beli

            if(count($daftarBeli) > 0) {
                foreach($daftarBeli as $item) {
                    $totalPembelian += $item['subtotal'];
                }

                // insert ke tabel pembelian
                $stmtPembelian = mysqli_prepare($conn, "INSERT INTO pembelian (id_pengguna, alamat_pengiriman, total_harga)
                VALUES (?, ?, ?)");

                $idPengguna = (int) $_SESSION['id_pengguna'];

                mysqli_stmt_bind_param($stmtPembelian, "isi", $idPengguna, $alamat, $totalPembelian);

                mysqli_stmt_execute($stmtPembelian);

                $idPembelian = mysqli_insert_id($conn);

                // insert setiap kendaraan ke detail_pembelian
                $stmtDetailBeli = mysqli_prepare(
                    $conn,
                    "INSERT INTO detail_pembelian
                    (id_pembelian, id_kendaraan, jumlah, harga_satuan, sub_total)
                    VALUES (?, ?, ?, ?, ?)"
                );

                foreach ($daftarBeli as $item) {

                    $idKendaraan = (int)$item['id_kendaraan'];
                    $jumlah = (int)$item['units'];
                    $hargaSatuan = (int)$item['harga_satuan'];
                    $subtotal = (int)$item['subtotal'];

                    // Kurangi stok jual
                    $stmtStok = mysqli_prepare(
                        $conn,
                        "UPDATE kendaraan
                        SET stok_jual = stok_jual - ?
                        WHERE id_kendaraan = ? AND stok_jual >= ?"
                    );

                    mysqli_stmt_bind_param(
                        $stmtStok,
                        "iii",
                        $jumlah,
                        $idKendaraan,
                        $jumlah
                    );

                    mysqli_stmt_execute($stmtStok);

                    if (mysqli_stmt_affected_rows($stmtStok) !== 1) {
                        throw new Exception("Stok kendaraan untuk pembelian tidak mencukupi.");
                    }

                    mysqli_stmt_bind_param(
                        $stmtDetailBeli,
                        "iiiii",
                        $idPembelian,
                        $idKendaraan,
                        $jumlah,
                        $hargaSatuan,
                        $subtotal
                    );

                    mysqli_stmt_execute($stmtDetailBeli);
                }
            }

            // transaksi penyewaan

            foreach ($daftarSewa as $item) {
                $idKendaraan = (int)$item['id_kendaraan'];
                $jumlah = (int)$item['units'];
                $hargaSatuan = (int)$item['harga_satuan'];
                $subtotal = (int)$item['subtotal'];

                // Ambil tanggal khusus kendaraan ini
                if (!isset($tanggalPerKendaraan[$idKendaraan])) {
                    throw new Exception("Rent date for vehicle $idKendaraan is required");
                }

                $tanggalMulai = $tanggalPerKendaraan[$idKendaraan]['tanggal_mulai'];
                $jumlahHari = $tanggalPerKendaraan[$idKendaraan]['jumlah_hari'];

                // Validasi tanggal dan durasi
                $tanggalValid = DateTime::createFromFormat('!Y-m-d', $tanggalMulai);

                if (
                    !$tanggalValid ||
                    $tanggalValid->format('Y-m-d') !== $tanggalMulai ||
                    $jumlahHari < 1
                ) {
                    throw new Exception("Rent date or duration for vehicle $idKendaraan is invalid");
                }

                // Hitung total sewa
                $totalPenyewaan += $subtotal;

                // Setiap kendaraan sewa memiliki record penyewaan sendiri
                $stmtPenyewaan = mysqli_prepare(
                    $conn,
                    "INSERT INTO penyewaan
                    (id_pengguna, tanggal_mulai, alamat_pengiriman, total_harga)
                    VALUES (?, ?, ?, ?)"
                );

                $idPengguna = (int)$_SESSION['id_pengguna'];

                mysqli_stmt_bind_param(
                    $stmtPenyewaan,
                    "issi",
                    $idPengguna,
                    $tanggalMulai,
                    $alamat,
                    $subtotal
                );

                mysqli_stmt_execute($stmtPenyewaan);

                $idPenyewaan = mysqli_insert_id($conn);

                // Kurangi stok sewa
                $stmtStokSewa = mysqli_prepare(
                    $conn,
                    "UPDATE kendaraan
                    SET stok_sewa = stok_sewa - ?
                    WHERE id_kendaraan = ? AND stok_sewa >= ?"
                );

                mysqli_stmt_bind_param(
                    $stmtStokSewa,
                    "iii",
                    $jumlah,
                    $idKendaraan,
                    $jumlah
                );

                mysqli_stmt_execute($stmtStokSewa);

                if (mysqli_stmt_affected_rows($stmtStokSewa) !== 1) {
                    throw new Exception("Stok kendaraan untuk penyewaan tidak mencukupi.");
                }

                // Insert ke detail_penyewaan
                $stmtDetailSewa = mysqli_prepare(
                    $conn,
                    "INSERT INTO detail_penyewaan
                    (id_penyewaan, id_kendaraan, jumlah, jumlah_hari, harga_satuan, sub_total)
                    VALUES (?, ?, ?, ?, ?, ?)"
                );

                mysqli_stmt_bind_param(
                    $stmtDetailSewa,
                    "iiiiii",
                    $idPenyewaan,
                    $idKendaraan,
                    $jumlah,
                    $jumlahHari,
                    $hargaSatuan,
                    $subtotal
                );

                mysqli_stmt_execute($stmtDetailSewa);
            }

            mysqli_commit($conn);

            // Hapus session checkout setelah transaksi berhasil
            if ($sumberCheckout === 'direct') {
                unset($_SESSION['checkout']);
            } else {
                if(isset($_SESSION['cart'])) {
                    foreach($daftarCheckout as $checkoutItem) {
                        $id = $checkoutItem['id_kendaraan'];
                        unset($_SESSION['cart'][$id]);
                    }
               }

               unset($_SESSION['checkout_cart']);
            }

            keluar([
                "success" => true,
                "message" => "Order placed successfully",
                "redirect" => "garage.xhtml"
            ]);

        } catch (Exception $e) {

            mysqli_rollback($conn);

            keluar([
                "success" => false,
                "message" => "Order failed: " . $e->getMessage()
            ], 400);
        }
    }

    keluar([
        "success" => false, 
        "message" => "Method not allowed"
    ], 405);
    
?>