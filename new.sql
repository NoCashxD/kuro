-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: May 10, 2025 at 08:22 AM
-- Server version: 10.11.10-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u679703987_Soi7`
--

-- --------------------------------------------------------

--
-- Table structure for table `function_code`
--

CREATE TABLE `function_code` (
  `id_path` int(11) NOT NULL,
  `NoCASH` varchar(15) NOT NULL,
  `Online` varchar(5) NOT NULL,
  `Bullet` varchar(5) DEFAULT NULL,
  `Aimbot` varchar(5) DEFAULT NULL,
  `Memory` varchar(5) DEFAULT NULL,
  `ModName` varchar(123) DEFAULT NULL,
  `Maintenance` varchar(250) DEFAULT NULL,
  `Hr1` varchar(15) DEFAULT NULL,
  `Days1` varchar(15) DEFAULT NULL,
  `Days3` varchar(15) DEFAULT NULL,
  `Days7` varchar(15) DEFAULT NULL,
  `Days30` varchar(15) DEFAULT NULL,
  `Days60` varchar(15) DEFAULT NULL,
  `Currency` varchar(15) DEFAULT NULL,
  `owner` varchar(66) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `function_code`
--

INSERT INTO `function_code` (`id_path`, `NoCASH`, `Online`, `Bullet`, `Aimbot`, `Memory`, `ModName`, `Maintenance`, `Hr1`, `Days1`, `Days3`, `Days7`, `Days30`, `Days60`, `Currency`, `owner`) VALUES
(1, 'NoCASH', 'true', 'false', 'false', 'false', 'NOCASH', ' ', '1', '1', '2', '4', '8', '12', '$', 'NOCASH');

-- --------------------------------------------------------

--
-- Table structure for table `history`
--

CREATE TABLE `history` (
  `id_history` int(11) NOT NULL,
  `keys_id` varchar(33) DEFAULT NULL,
  `user_do` varchar(33) DEFAULT NULL,
  `info` mediumtext NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `owner` varchar(66) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `keys_code`
--

CREATE TABLE `keys_code` (
  `id_keys` int(11) NOT NULL,
  `game` varchar(32) NOT NULL,
  `user_key` varchar(32) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `expired_date` datetime DEFAULT NULL,
  `max_devices` int(11) DEFAULT NULL,
  `devices` mediumtext DEFAULT NULL,
  `status` tinyint(1) DEFAULT 1,
  `registrator` varchar(32) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `key_reset_time` varchar(1) DEFAULT NULL,
  `key_reset_token` varchar(100) DEFAULT NULL,
  `owner` varchar(66) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `modname`
--

CREATE TABLE `modname` (
  `id` int(11) NOT NULL,
  `modname` varchar(100) NOT NULL,
  `owner` varchar(66) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `modname`
--

INSERT INTO `modname` (`id`, `modname`, `owner`) VALUES
(1, 'N O C A S H', 'NOCASH');

-- --------------------------------------------------------

--
-- Table structure for table `onoff`
--

CREATE TABLE `onoff` (
  `id` int(11) NOT NULL,
  `status` varchar(5) NOT NULL,
  `myinput` varchar(500) NOT NULL,
  `owner` varchar(66) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `onoff`
--

INSERT INTO `onoff` (`id`, `status`, `myinput`, `owner`) VALUES
(11, 'on', '', 'NOCASH');

-- --------------------------------------------------------

--
-- Table structure for table `referral_code`
--

CREATE TABLE `referral_code` (
  `id_reff` int(11) NOT NULL,
  `code` varchar(128) NOT NULL,
  `Referral` varchar(7) NOT NULL,
  `level` int(11) NOT NULL,
  `set_saldo` int(11) NOT NULL DEFAULT 2,
  `used_by` varchar(66) NOT NULL,
  `created_by` varchar(66) NOT NULL DEFAULT 'Owner2',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `acc_expiration` datetime DEFAULT NULL,
  `owner` varchar(66) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id_users` int(11) NOT NULL,
  `fullname` varchar(155) DEFAULT NULL,
  `username` varchar(66) NOT NULL,
  `exp_date` varchar(260) NOT NULL,
  `level` int(11) DEFAULT 2,
  `saldo` int(11) DEFAULT NULL,
  `status` tinyint(1) DEFAULT 1,
  `uplink` varchar(66) DEFAULT NULL,
  `password` varchar(155) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `loginDevices` varchar(150) DEFAULT NULL,
  `loginRsetTime` varchar(5) DEFAULT NULL,
  `expiration_date` datetime DEFAULT NULL,
  `owner` varchar(66) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id_users`, `fullname`, `username`, `exp_date`, `level`, `saldo`, `status`, `uplink`, `password`, `created_at`, `updated_at`, `loginDevices`, `loginRsetTime`, `expiration_date`, `owner`) VALUES
(1, 'NOCASH', 'NOCASH', '', 1, 2147483647, 1, 'NOCASH', '$2y$08$RrsDqMPJ1zv65RGkJhYqaOLByKNkvjZFgtgSOd2GOFrij3aS6lCAe', '2025-02-06 19:43:17', '2025-02-06 19:43:17', '', '3', '3000-01-01 01:00:00', 'NOCASH');

-- --------------------------------------------------------

--
-- Table structure for table `_ftext`
--

CREATE TABLE `_ftext` (
  `id` int(11) NOT NULL,
  `_status` varchar(100) NOT NULL,
  `_ftext` varchar(100) NOT NULL,
  `owner` varchar(66) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `_ftext`
--

INSERT INTO `_ftext` (`id`, `_status`, `_ftext`, `owner`) VALUES
(1, 'Safe', 'S A F E', 'NOCASH');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `function_code`
--
ALTER TABLE `function_code`
  ADD PRIMARY KEY (`id_path`),
  ADD UNIQUE KEY `RedZONERROR` (`NoCASH`),
  ADD KEY `idx_owner` (`owner`);

--
-- Indexes for table `history`
--
ALTER TABLE `history`
  ADD PRIMARY KEY (`id_history`),
  ADD KEY `idx_owner` (`owner`);

--
-- Indexes for table `keys_code`
--
ALTER TABLE `keys_code`
  ADD PRIMARY KEY (`id_keys`),
  ADD UNIQUE KEY `user_key` (`user_key`),
  ADD KEY `idx_owner` (`owner`);

--
-- Indexes for table `modname`
--
ALTER TABLE `modname`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_owner` (`owner`);

--
-- Indexes for table `onoff`
--
ALTER TABLE `onoff`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_owner` (`owner`);

--
-- Indexes for table `referral_code`
--
ALTER TABLE `referral_code`
  ADD PRIMARY KEY (`id_reff`),
  ADD KEY `idx_owner` (`owner`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id_users`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_owner` (`owner`);

--
-- Indexes for table `_ftext`
--
ALTER TABLE `_ftext`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_owner` (`owner`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `history`
--
ALTER TABLE `history`
  MODIFY `id_history` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `keys_code`
--
ALTER TABLE `keys_code`
  MODIFY `id_keys` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `modname`
--
ALTER TABLE `modname`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `onoff`
--t
ALTER TABLE `onoff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `referral_code`
--
ALTER TABLE `referral_code`
  MODIFY `id_reff` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id_users` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `_ftext`
--
ALTER TABLE `_ftext`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
