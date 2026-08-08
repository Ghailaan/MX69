-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 07, 2026 at 11:18 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `blackmarket_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `created_at`) VALUES
(1, 'Weapon - Class 1', '2026-08-07 20:34:46'),
(2, 'Weapon - Class 2', '2026-08-07 20:34:46'),
(3, 'Weapon - Class 3', '2026-08-07 20:34:46'),
(4, 'Ammo', '2026-08-07 20:34:46'),
(5, 'Vest', '2026-08-07 20:34:46');

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `box_qty` int(11) DEFAULT NULL COMMENT 'Jumlah isi per box (khusus ammo/peluru)',
  `description` text DEFAULT NULL,
  `is_dynamic_price` tinyint(1) DEFAULT 0 COMMENT '1 jika harga bisa naik/turun',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`id`, `category_id`, `name`, `price`, `box_qty`, `description`, `is_dynamic_price`, `updated_at`) VALUES
(1, 1, 'Minirevo', 1600000.00, NULL, 'Harga sudah termasuk potongan cuci + kantor', 0, '2026-08-07 20:34:46'),
(2, 1, 'Glok18', 600000.00, NULL, 'Harga sudah termasuk potongan cuci + kantor', 0, '2026-08-07 20:34:46'),
(3, 2, 'Mac11', 1000000.00, NULL, 'Harga sudah termasuk potongan cuci + kantor', 0, '2026-08-07 20:34:46'),
(4, 3, 'Pumpshotgun', 2000000.00, NULL, 'Harga sudah termasuk potongan cuci + kantor', 0, '2026-08-07 20:34:46'),
(5, 3, '3d printer bundling', 3700000.00, NULL, 'Isi bundling: Weapon, Ammo, Attachment', 0, '2026-08-07 20:34:46'),
(6, 3, '3d printer weapon only', 1600000.00, NULL, 'Weapon only', 0, '2026-08-07 20:34:46'),
(7, 4, '5.5x46', 260000.00, 100, 'Harga per box', 0, '2026-08-07 20:34:46'),
(8, 4, '38lc', 200000.00, 60, 'Harga per box. Harga bisa naik/turun', 1, '2026-08-07 20:34:46'),
(9, 4, '12gauge', 260000.00, 50, 'Harga per box', 0, '2026-08-07 20:34:46'),
(10, 4, '9mm', 200000.00, 120, 'Harga per box', 0, '2026-08-07 20:34:46'),
(11, 4, '45acp', 200000.00, 120, 'Harga per box', 0, '2026-08-07 20:34:46'),
(12, 5, 'Vest Roxwood', 130000.00, NULL, 'Harga bisa naik/turun', 1, '2026-08-07 20:34:46');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `uang_hitam` decimal(15,2) NOT NULL,
  `foto_bukti` longtext DEFAULT NULL,
  `jenis_senjata` varchar(100) NOT NULL,
  `jenis_peluru` varchar(100) NOT NULL,
  `jenis_vest` varchar(100) DEFAULT '-',
  `catatan` text DEFAULT NULL,
  `status` enum('pending','proses','selesai','ditolak') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
