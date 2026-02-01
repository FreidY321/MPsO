-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 21, 2025 at 10:01 AM
-- Server version: 10.11.13-MariaDB-0ubuntu0.24.04.1
-- PHP Version: 8.4.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `MaturitniCetba`
--
CREATE DATABASE IF NOT EXISTS `MaturitniCetba` DEFAULT CHARACTER SET utf16 COLLATE utf16_czech_ci;
USE `MaturitniCetba`;

-- --------------------------------------------------------

--
-- Table structure for table `Authors`
--

CREATE TABLE IF NOT EXISTS `Authors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NULL,
  `second_name` varchar(32) DEFAULT NULL,
  `surname` varchar(32) NOT NULL,
  `second_surname` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf16 COLLATE=utf16_czech_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Books`
--

CREATE TABLE IF NOT EXISTS `Books` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `url_book` varchar(128) NULL,
  `author_id` int(11) NOT NULL,
  `translator_name` varchar(64) NOT NULL,
  `period` int(11) NOT NULL,
  `literary_class` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `literary_class` (`literary_class`),
  KEY `period` (`period`),
  KEY `author_id` (`author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf16 COLLATE=utf16_czech_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Classes`
--

CREATE TABLE IF NOT EXISTS `Classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(4) NOT NULL,
  `year_ended` int(11) NOT NULL,
  `deadline` datetime DEFAULT NULL,
  `cj_teacher` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cj_teacher` (`cj_teacher`)
) ENGINE=InnoDB DEFAULT CHARSET=utf16 COLLATE=utf16_czech_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Literary_classes`
--

CREATE TABLE IF NOT EXISTS `Literary_classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `min_request` int(11) NULL,
  `max_request` int(11) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf16 COLLATE=utf16_czech_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Periods`
--

CREATE TABLE IF NOT EXISTS `Periods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `min_request` int(11) NULL,
  `max_request` int(11) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf16 COLLATE=utf16_czech_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_book`
--

CREATE TABLE IF NOT EXISTS `student_book` (
  `id_student` int(11) NOT NULL,
  `id_book` int(11) NOT NULL,
  `when_added` datetime NOT NULL,
  PRIMARY KEY (`id_student`,`id_book`),
  KEY `id_book` (`id_book`)
) ENGINE=InnoDB DEFAULT CHARSET=utf16 COLLATE=utf16_czech_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Users`
--

CREATE TABLE IF NOT EXISTS `Users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role` enum('student','teacher','admin') NOT NULL,
  `degree` varchar(16) DEFAULT NULL,
  `name` varchar(32) NOT NULL,
  `second_name` varchar(32) DEFAULT NULL,
  `surname` varchar(32) NOT NULL,
  `second_surname` varchar(32) DEFAULT NULL,
  `email` varchar(128) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `password` varchar(256) DEFAULT NULL,
  `google_id` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `class_id` (`class_id`)
) ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Books`
--
ALTER TABLE `Books`
  ADD CONSTRAINT `Books_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `Authors` (`id`),
  ADD CONSTRAINT `Books_ibfk_2` FOREIGN KEY (`period`) REFERENCES `Periods` (`id`),
  ADD CONSTRAINT `Books_ibfk_3` FOREIGN KEY (`literary_class`) REFERENCES `Literary_classes` (`id`);

--
-- Constraints for table `Classes`
--
ALTER TABLE `Classes`
  ADD CONSTRAINT `Classes_ibfk_1` FOREIGN KEY (`cj_teacher`) REFERENCES `Users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `student_book`
--
ALTER TABLE `student_book`
  ADD CONSTRAINT `student_book_ibfk_1` FOREIGN KEY (`id_student`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `student_book_ibfk_2` FOREIGN KEY (`id_book`) REFERENCES `Books` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `Users`
--
ALTER TABLE `Users`
  ADD CONSTRAINT `Users_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `Classes` (`id`) ON DELETE CASCADE;

--
-- Insert test data
--

-- Insert test periods
INSERT INTO `Periods` ( `name`, `min_request`) VALUES
('Světová a česká literatura do konce 18. stol.', 2),
('Světová a česká literatura 19. stol.', 3),
('Světová literatura 20. a 21. století', 4),
('Česká literatura 20. a 21. století', 5);

-- Insert test literary classes
INSERT INTO `Literary_classes` (`name`, `min_request`) VALUES
('Próza', 2),
('Poezie', 2),
('Drama', 2);

-- Insert test class
INSERT INTO `Classes` (`name`, `year_ended`, `deadline`, `cj_teacher`) VALUES
('I4C', 2026, '2026-06-30 23:59:59', NULL);

-- Insert test users with bcrypt hashed passwords (password: Test123!)
-- Hash: $2b$10$SZVfZsOSII2R1A5/j7eSa.t1xG6tPGQRCquCTL72pv8cKlMf84p5S
INSERT INTO `Users` (`role`, `degree`, `name`, `surname`, `email`, `class_id`, `password`) VALUES
('admin', NULL, 'Admin', 'Testovací', 'admin@test.cz', NULL, '$2b$10$SZVfZsOSII2R1A5/j7eSa.t1xG6tPGQRCquCTL72pv8cKlMf84p5S'),
('teacher', 'Mgr.', 'Jana', 'Nováková', 'teacher@test.cz', NULL, '$2b$10$SZVfZsOSII2R1A5/j7eSa.t1xG6tPGQRCquCTL72pv8cKlMf84p5S'),
('student', NULL, 'Petr', 'Novák', 'student@test.cz', 1, '$2b$10$SZVfZsOSII2R1A5/j7eSa.t1xG6tPGQRCquCTL72pv8cKlMf84p5S');

-- Update class with teacher
UPDATE `Classes` SET `cj_teacher` = 2 WHERE `id` = 1;

-- Insert test authors
INSERT INTO `Authors` (`name`, `surname`) VALUES
('William', 'Shakespeare'),
('Émile', 'Zola'),
('Ernest', 'Hemingway'),
('Viktor', 'Dyk');

-- Insert test books
INSERT INTO `Books` (`name`, `author_id`, `translator_name`, `period`, `literary_class`) VALUES
('Hamlet', 1, 'E. A. Saudek', 1, 3),
('Zabiják', 2, 'Luděk Kárl', 2, 1),
('Stařec a moře', 3, 'Václav Rákos', 3, 1),
('Krysař', 4, 'Originál', 4, 1);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
