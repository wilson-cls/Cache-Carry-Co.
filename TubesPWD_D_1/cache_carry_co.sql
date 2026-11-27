-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 22, 2026 at 05:14 PM
-- Server version: 10.11.16-MariaDB
-- PHP Version: 8.5.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cache_carry_co`
--

-- --------------------------------------------------------

--
-- Table structure for table `detail_pembelian`
--

CREATE TABLE `detail_pembelian` (
  `id_detail` int(11) NOT NULL,
  `id_pembelian` int(11) NOT NULL,
  `id_kendaraan` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `harga_satuan` bigint(20) NOT NULL,
  `sub_total` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `detail_penyewaan`
--

CREATE TABLE `detail_penyewaan` (
  `id_detail` int(11) NOT NULL,
  `id_penyewaan` int(11) NOT NULL,
  `id_kendaraan` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `jumlah_hari` int(11) NOT NULL,
  `harga_satuan` bigint(20) NOT NULL,
  `sub_total` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kategori`
--

CREATE TABLE `kategori` (
  `id_kategori` int(11) NOT NULL,
  `nama_kategori` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kategori`
--

INSERT INTO `kategori` (`id_kategori`, `nama_kategori`) VALUES
(1, 'Udara'),
(2, 'Laut'),
(3, 'Darat');

-- --------------------------------------------------------

--
-- Table structure for table `kendaraan`
--

CREATE TABLE `kendaraan` (
  `id_kendaraan` int(11) NOT NULL,
  `id_kategori` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `merek` varchar(50) DEFAULT NULL,
  `kapasitas_penumpang` int(11) DEFAULT NULL,
  `kecepatan` int(11) DEFAULT NULL,
  `tahun` year(4) DEFAULT NULL,
  `deskripsi` text DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `harga_jual` bigint(20) NOT NULL,
  `harga_sewa` bigint(20) NOT NULL,
  `stok_jual` int(11) NOT NULL DEFAULT 0,
  `stok_sewa` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kendaraan`
--

INSERT INTO `kendaraan` (`id_kendaraan`, `id_kategori`, `nama`, `merek`, `kapasitas_penumpang`, `kecepatan`, `tahun`, `deskripsi`, `foto`, `harga_jual`, `harga_sewa`, `stok_jual`, `stok_sewa`) VALUES
(1, 1, 'Airbus H125', 'Airbus Helicopters', 6, 240, '2024', 'Single-engine utility helicopter trusted for a wide range of operations, from tours and cargo to rescue missions.', 'images/Kendaraan Udara/Airbus H125.svg', 58000000000, 150000000, 4, 5),
(2, 1, 'Bell 429', 'Bell Textron', 7, 278, '2024', 'Twin-engine VIP helicopter with a spacious cabin, built for comfort and safety on executive flights.', 'images/Kendaraan Udara/Bell 429.svg', 132000000000, 250000000, 3, 3),
(3, 1, 'Pilatus PC-24', 'Pilatus Aircraft', 8, 815, '2023', 'Business jet capable of operating from short and unpaved runways, combining jet speed with utility.', 'images/Kendaraan Udara/Pilatus PC-24.svg', 182000000000, 450000000, 2, 2),
(4, 1, 'Cessna Citation Longitude', 'Cessna', 12, 880, '2023', 'Super-midsize business jet with a luxurious cabin and long-range performance.', 'images/Kendaraan Udara/Cessna Citation Longitude.svg', 480000000000, 700000000, 2, 1),
(5, 1, 'ICON A5', 'ICON Aircraft', 2, 190, '2022', 'Light amphibious sport aircraft that can take off and land on both runways and water.', 'images/Kendaraan Udara/ICON A5.svg', 6600000000, 30000000, 5, 6),
(6, 2, 'Sunreef 80 Power', 'Sunreef Yachts', 12, 37, '2024', 'Twin-hull power catamaran superyacht with wide decks and a spacious, stable interior.', 'images/Kendaraan Laut/Sunreef 80 Power.svg', 110000000000, 150000000, 2, 2),
(7, 2, 'Lurssen Azzam', 'Lürssen', 36, 58, '2013', 'One of the largest and fastest superyachts ever built, an ultra-luxury vessel of extraordinary scale.', 'images/Kendaraan Laut/Lürssen Azzam.svg', 9900000000000, 15000000000, 1, 0),
(8, 2, 'Damen SeaXplorer 77', 'Damen Yachting', 12, 26, '2023', 'Expedition yacht designed for extreme voyages to remote destinations with long-range capability.', 'images/Kendaraan Laut/Damen SeaXplorer 77.svg', 1070000000000, 400000000, 1, 1),
(9, 2, 'U-Boat Worx Nemo', 'U-Boat Worx', 2, 6, '2022', 'Compact private submarine with a panoramic acrylic dome for exploring the underwater world.', 'images/Kendaraan Laut/U-Boat Worx Nemo.svg', 49500000000, 150000000, 3, 2),
(10, 2, 'Migaloo M5', 'Migaloo Private Submersible Yachts', 12, 37, '2023', 'Private submersible superyacht that cruises on the surface and dives like a submarine, an ultra-exclusive vessel for owners who want the ocean on their own terms.', 'images/Kendaraan Laut/MIGALOO M5.svg', 33000000000000, 5000000000, 1, 0),
(11, 3, 'Czinger 21C', 'Czinger', 2, 430, '2023', 'Hypercar built with 3D-printed manufacturing, with a tandem two-seat cockpit and extreme performance.', 'images/Kendaraan Darat/Czinger 21C.svg', 34000000000, 80000000, 2, 1),
(12, 3, 'Ariel Nomad', 'Ariel Motor Company', 2, 200, '2024', 'High-performance buggy built for rough terrain, light, open, and extremely agile.', 'images/Kendaraan Darat/Ariel Nomad.svg', 1500000000, 8000000, 8, 6),
(13, 3, 'Rinspeed sQuba', 'Rinspeed', 2, 120, '2008', 'Concept car that can drive on land and dive underwater. A rare one-off showpiece.', 'images/Kendaraan Darat/Rinspeed sQuba.svg', 5000000000, 25000000, 1, 1),
(14, 3, 'BelAZ 75710', 'BelAZ', 1, 64, '2022', 'Giant mining truck with a payload of around 450 tonnes, built for open-pit mines.', 'images/Kendaraan Darat/BelAZ 75710.svg', 170000000000, 100000000, 2, 2),
(15, 3, 'Bagger 293', 'TAKRAF', 5, 1, '1995', 'Giant bucket-wheel excavator for open-pit mining, one of the largest land vehicles ever built.', 'images/Kendaraan Darat/Bagger 293.svg', 1500000000000, 500000000, 1, 0),
(16, 3, 'Komatsu D575A', 'Komatsu', 1, 7, '2023', 'The largest production bulldozer in its class, designed for heavy earthmoving in large mines.', 'images/Kendaraan Darat/Komatsu D575A.svg', 25000000000, 25000000, 5, 6),
(17, 3, 'Caterpillar 797F', 'Caterpillar', 1, 68, '2023', 'Large-scale mining haul truck with a payload of around 363 tonnes.', 'images/Kendaraan Darat/Caterpillar 797F.svg', 90000000000, 60000000, 5, 4),
(18, 3, 'Oshkosh M1070', 'Oshkosh Defense', 3, 85, '2022', 'Heavy Equipment Transporter for hauling heavy vehicles such as tanks and large machinery.', 'images/Kendaraan Darat/Oshkosh M1070.svg', 13000000000, 15000000, 6, 5);

-- --------------------------------------------------------

--
-- Table structure for table `keranjang`
--

CREATE TABLE `keranjang` (
  `id_keranjang` int(11) NOT NULL,
  `id_pengguna` int(11) NOT NULL,
  `id_kendaraan` int(11) NOT NULL,
  `tipe` enum('buy','rent') NOT NULL,
  `jumlah` int(11) NOT NULL DEFAULT 1,
  `jumlah_hari` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pembelian`
--

CREATE TABLE `pembelian` (
  `id_pembelian` int(11) NOT NULL,
  `id_pengguna` int(11) NOT NULL,
  `tanggal_beli` datetime DEFAULT current_timestamp(),
  `alamat_pengiriman` text NOT NULL,
  `total_harga` bigint(20) NOT NULL,
  `status` enum('proceed','sent','done') NOT NULL DEFAULT 'proceed'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengguna`
--

CREATE TABLE `pengguna` (
  `id_pengguna` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nomor_telepon` varchar(20) DEFAULT NULL,
  `alamat_default` text DEFAULT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `penyewaan`
--

CREATE TABLE `penyewaan` (
  `id_penyewaan` int(11) NOT NULL,
  `id_pengguna` int(11) NOT NULL,
  `tanggal_sewa` datetime DEFAULT current_timestamp(),
  `tanggal_mulai` date NOT NULL,
  `alamat_pengiriman` text NOT NULL,
  `total_harga` bigint(20) NOT NULL,
  `status` enum('proceed','sent','done') NOT NULL DEFAULT 'proceed'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `detail_pembelian`
--
ALTER TABLE `detail_pembelian`
  ADD PRIMARY KEY (`id_detail`),
  ADD KEY `id_pembelian` (`id_pembelian`),
  ADD KEY `id_kendaraan` (`id_kendaraan`);

--
-- Indexes for table `detail_penyewaan`
--
ALTER TABLE `detail_penyewaan`
  ADD PRIMARY KEY (`id_detail`),
  ADD KEY `id_penyewaan` (`id_penyewaan`),
  ADD KEY `id_kendaraan` (`id_kendaraan`);

--
-- Indexes for table `kategori`
--
ALTER TABLE `kategori`
  ADD PRIMARY KEY (`id_kategori`);

--
-- Indexes for table `kendaraan`
--
ALTER TABLE `kendaraan`
  ADD PRIMARY KEY (`id_kendaraan`),
  ADD KEY `id_kategori` (`id_kategori`);

--
-- Indexes for table `keranjang`
--
ALTER TABLE `keranjang`
  ADD PRIMARY KEY (`id_keranjang`),
  ADD KEY `id_pengguna` (`id_pengguna`),
  ADD KEY `id_kendaraan` (`id_kendaraan`);

--
-- Indexes for table `pembelian`
--
ALTER TABLE `pembelian`
  ADD PRIMARY KEY (`id_pembelian`),
  ADD KEY `id_pengguna` (`id_pengguna`);

--
-- Indexes for table `pengguna`
--
ALTER TABLE `pengguna`
  ADD PRIMARY KEY (`id_pengguna`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `penyewaan`
--
ALTER TABLE `penyewaan`
  ADD PRIMARY KEY (`id_penyewaan`),
  ADD KEY `id_pengguna` (`id_pengguna`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `detail_pembelian`
--
ALTER TABLE `detail_pembelian`
  MODIFY `id_detail` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `detail_penyewaan`
--
ALTER TABLE `detail_penyewaan`
  MODIFY `id_detail` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kategori`
--
ALTER TABLE `kategori`
  MODIFY `id_kategori` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `kendaraan`
--
ALTER TABLE `kendaraan`
  MODIFY `id_kendaraan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `keranjang`
--
ALTER TABLE `keranjang`
  MODIFY `id_keranjang` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pembelian`
--
ALTER TABLE `pembelian`
  MODIFY `id_pembelian` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pengguna`
--
ALTER TABLE `pengguna`
  MODIFY `id_pengguna` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `penyewaan`
--
ALTER TABLE `penyewaan`
  MODIFY `id_penyewaan` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `detail_pembelian`
--
ALTER TABLE `detail_pembelian`
  ADD CONSTRAINT `detail_pembelian_ibfk_1` FOREIGN KEY (`id_pembelian`) REFERENCES `pembelian` (`id_pembelian`) ON DELETE CASCADE,
  ADD CONSTRAINT `detail_pembelian_ibfk_2` FOREIGN KEY (`id_kendaraan`) REFERENCES `kendaraan` (`id_kendaraan`);

--
-- Constraints for table `detail_penyewaan`
--
ALTER TABLE `detail_penyewaan`
  ADD CONSTRAINT `detail_penyewaan_ibfk_1` FOREIGN KEY (`id_penyewaan`) REFERENCES `penyewaan` (`id_penyewaan`) ON DELETE CASCADE,
  ADD CONSTRAINT `detail_penyewaan_ibfk_2` FOREIGN KEY (`id_kendaraan`) REFERENCES `kendaraan` (`id_kendaraan`);

--
-- Constraints for table `kendaraan`
--
ALTER TABLE `kendaraan`
  ADD CONSTRAINT `kendaraan_ibfk_1` FOREIGN KEY (`id_kategori`) REFERENCES `kategori` (`id_kategori`);

--
-- Constraints for table `keranjang`
--
ALTER TABLE `keranjang`
  ADD CONSTRAINT `keranjang_ibfk_1` FOREIGN KEY (`id_pengguna`) REFERENCES `pengguna` (`id_pengguna`) ON DELETE CASCADE,
  ADD CONSTRAINT `keranjang_ibfk_2` FOREIGN KEY (`id_kendaraan`) REFERENCES `kendaraan` (`id_kendaraan`) ON DELETE CASCADE;

--
-- Constraints for table `pembelian`
--
ALTER TABLE `pembelian`
  ADD CONSTRAINT `pembelian_ibfk_1` FOREIGN KEY (`id_pengguna`) REFERENCES `pengguna` (`id_pengguna`);

--
-- Constraints for table `penyewaan`
--
ALTER TABLE `penyewaan`
  ADD CONSTRAINT `penyewaan_ibfk_1` FOREIGN KEY (`id_pengguna`) REFERENCES `pengguna` (`id_pengguna`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
