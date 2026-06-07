-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 07, 2026 at 06:04 AM
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
-- Database: `codapt_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `achievements`
--

CREATE TABLE `achievements` (
  `id` int(11) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `earned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `activities`
--

CREATE TABLE `activities` (
  `id` int(11) NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `activity_type` varchar(255) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `activity_type` varchar(50) NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `activity_type`, `description`, `created_at`) VALUES
(1, 1, 'seed', 'Seeded activity for learner1', '2026-06-01 11:15:10'),
(2, 2, 'seed', 'Seeded activity for learner2', '2026-06-01 11:15:10'),
(3, 3, 'seed', 'Seeded activity for learner3', '2026-06-01 11:15:10'),
(4, 1, 'submission', 'Java Variables submission attempted', '2026-06-02 12:01:39');

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `role` varchar(50) DEFAULT 'admin',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_settings`
--

CREATE TABLE `admin_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(255) NOT NULL,
  `setting_value` text NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `daily_progress`
--

CREATE TABLE `daily_progress` (
  `id` int(11) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `language` varchar(100) NOT NULL,
  `progress_date` date NOT NULL,
  `score` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `daily_progress`
--

INSERT INTO `daily_progress` (`id`, `user_id`, `language`, `progress_date`, `score`, `created_at`) VALUES
(1, 8, 'Java', '2026-06-03', 100, '2026-06-03 15:43:55'),
(2, 9, 'Java', '2026-06-05', 0, '2026-06-05 11:16:15');

-- --------------------------------------------------------

--
-- Table structure for table `lessons`
--

CREATE TABLE `lessons` (
  `id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

CREATE TABLE `logs` (
  `id` int(11) NOT NULL,
  `level` varchar(50) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`meta`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `modules`
--

CREATE TABLE `modules` (
  `id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `total_lessons` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `problems`
--

CREATE TABLE `problems` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `language` varchar(50) NOT NULL,
  `concept` varchar(100) NOT NULL,
  `difficulty` varchar(30) NOT NULL,
  `problem_tier` varchar(30) NOT NULL,
  `title` varchar(255) NOT NULL,
  `explanation` mediumtext NOT NULL,
  `instruction` mediumtext NOT NULL,
  `expected_output` mediumtext NOT NULL,
  `hints` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`hints`)),
  `required_construct` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `level` varchar(30) GENERATED ALWAYS AS (`problem_tier`) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `problems`
--

INSERT INTO `problems` (`id`, `language`, `concept`, `difficulty`, `problem_tier`, `title`, `explanation`, `instruction`, `expected_output`, `hints`, `required_construct`, `created_at`, `updated_at`) VALUES
(1, 'Java', 'Variables', 'Easy', 'Beginner', 'Declare a String Variable', '<p>In Java every variable must have a <strong>data type</strong> declared before its name.</p>\n   <p>For text values use the type <code>String</code>. The value must be wrapped in double quotes.</p>\n   <p>Every statement ends with a semicolon <code>;</code>.</p>\n   <p>Use <code>System.out.println()</code> to display output.</p>\n   <p>Example:</p>\n   <pre>String city = \"Tokyo\";\nSystem.out.println(city);</pre>', 'Inside the main method, declare a String variable called name with the value \"John\". Then print it.', 'John', '{\"level1\":\"In Java you must write the type before the variable name. The type for text is String.\",\"level2\":\"Write: String name = \\\"John\\\"; — do not forget the semicolon at the end.\",\"level3\":\"String name = \\\"John\\\";\\nSystem.out.println(name);\"}', NULL, '2026-06-02 10:56:05', '2026-06-02 11:15:10'),
(2, 'Java', 'Variables', 'Easy', 'Beginner', 'Declare an Integer Variable', '<p>Use the type <code>int</code> to store whole numbers in Java.</p>\n   <p>Number values do NOT use quotes. Just write the number directly.</p>\n   <p>Example:</p>\n   <pre>int score = 95;\nSystem.out.println(score);</pre>', 'Declare an int variable called age with the value 18. Then print it.', '18', '{\"level1\":\"The data type for whole numbers in Java is int.\",\"level2\":\"Write: int age = 18; — number values do not need quotes.\",\"level3\":\"int age = 18;\\nSystem.out.println(age);\"}', NULL, '2026-06-02 10:56:05', '2026-06-02 11:15:10'),
(3, 'Java', 'Variables', 'Easy', 'Beginner', 'Declare Two Variables', '<p>You can declare as many variables as you need, each on its own line.</p>\n   <p>Use a different type for each kind of value:</p>\n   <ul>\n     <li><code>String</code> for text</li>\n     <li><code>int</code> for whole numbers</li>\n   </ul>\n   <p>Call <code>System.out.println()</code> once per variable to print each on its own line.</p>', 'Declare a String variable called city with the value \"Manila\" and an int variable called year with the value 2025. Print city on the first line and year on the second line.', 'Manila\n2025', '{\"level1\":\"Declare two separate variables on two separate lines, each with its own type.\",\"level2\":\"String city = \\\"Manila\\\";  then on the next line  int year = 2025;\",\"level3\":\"String city = \\\"Manila\\\";\\nint year = 2025;\\nSystem.out.println(city);\\nSystem.out.println(year);\"}', NULL, '2026-06-02 10:56:05', '2026-06-02 11:15:10'),
(4, 'Java', 'Variables', 'Easy', 'Intermediate', 'Compute the Area of a Rectangle', '<p>Variables can store the result of a calculation. Use the <code>*</code> operator to multiply.</p>\n   <p>You can store the result of an expression in a new variable:</p>\n   <pre>int length = 7;\nint width  = 4;\nint area   = length * width;</pre>\n   <p>Then print the result with <code>System.out.println(area);</code></p>', 'Declare int variables length = 7 and width = 4. Compute their product and store it in a variable called area. Print area.', '28', '{\"level1\":\"Create a third variable to hold the result: int area = ...\",\"level2\":\"Use the * operator: int area = length * width;\",\"level3\":\"int length = 7;\\nint width = 4;\\nint area = length * width;\\nSystem.out.println(area);\"}', NULL, '2026-06-02 10:56:05', '2026-06-02 11:15:11'),
(5, 'Java', 'Variables', 'Easy', 'Intermediate', 'Celsius to Fahrenheit', '<p>Variables hold numeric values you can compute with. The formula to convert Celsius to Fahrenheit is:</p>\n   <p><strong>F = C × 9 / 5 + 32</strong></p>\n   <p>Because we are working with decimal results, use the <code>double</code> type instead of <code>int</code>.</p>\n   <p>Example:</p>\n   <pre>double celsius = 0.0;\ndouble fahrenheit = celsius * 9.0 / 5.0 + 32.0;</pre>', 'Declare a double variable called celsius with the value 25.0. Convert it to Fahrenheit using the formula and store the result in a variable called fahrenheit. Print fahrenheit.', '77.0', '{\"level1\":\"The formula is: fahrenheit = celsius * 9 / 5 + 32\",\"level2\":\"Use double instead of int so the decimal is preserved: double fahrenheit = celsius * 9.0 / 5.0 + 32.0;\",\"level3\":\"double celsius = 25.0;\\ndouble fahrenheit = celsius * 9.0 / 5.0 + 32.0;\\nSystem.out.println(fahrenheit);\"}', NULL, '2026-06-02 10:56:05', '2026-06-02 11:15:11'),
(6, 'Java', 'Variables', 'Easy', 'Intermediate', 'Full Name Concatenation', '<p>The <code>+</code> operator joins (concatenates) String values together.</p>\n   <p>You can include a space between two strings by adding <code>\" \"</code>:</p>\n   <pre>String firstName = \"Maria\";\nString lastName  = \"Santos\";\nString fullName  = firstName + \" \" + lastName;</pre>\n   <p>Then print <code>fullName</code>.</p>', 'Declare a String variable called firstName with value \"Maria\" and another called lastName with value \"Santos\". Combine them with a space in between and store the result in fullName. Print fullName.', 'Maria Santos', '{\"level1\":\"Use the + operator to join strings together.\",\"level2\":\"Add a space string between them: firstName + \\\" \\\" + lastName\",\"level3\":\"String firstName = \\\"Maria\\\";\\nString lastName = \\\"Santos\\\";\\nString fullName = firstName + \\\" \\\" + lastName;\\nSystem.out.println(fullName);\"}', NULL, '2026-06-02 10:56:05', '2026-06-02 11:15:11'),
(7, 'Java', 'Variables', 'Easy', 'Advanced', 'Circle Circumference', '<p>Java provides the constant <code>Math.PI</code> for the value of π.</p>\n   <p>The formula for circumference is: <strong>C = 2 × π × r</strong></p>\n   <p>Use <code>double</code> for decimal precision.</p>\n   <p>To round to 2 decimal places, use <code>Math.round(value * 100.0) / 100.0</code>.</p>', 'Declare a double variable called radius with the value 5.0. Compute the circumference using Math.PI and store it in a variable called circumference. Print the result rounded to 2 decimal places.', '31.42', '{\"level1\":\"Use Math.PI for the value of π. The formula is C = 2 * Math.PI * radius.\",\"level2\":\"Store the result: double circumference = 2 * Math.PI * radius;\",\"level3\":\"double radius = 5.0;\\ndouble circumference = 2 * Math.PI * radius;\\ndouble rounded = Math.round(circumference * 100.0) / 100.0;\\nSystem.out.println(rounded);\"}', NULL, '2026-06-02 10:56:05', '2026-06-02 11:15:11'),
(8, 'Java', 'Variables', 'Easy', 'Advanced', 'BMI Calculator', '<p>BMI (Body Mass Index) measures body fat based on weight and height.</p>\n   <p>Formula: <strong>BMI = weight / (height × height)</strong></p>\n   <p>Use <code>double</code> for all values. To raise height to the power of 2 multiply it by itself: <code>height * height</code>.</p>\n   <p>Round the result to 1 decimal place using <code>Math.round(value * 10.0) / 10.0</code>.</p>', 'Declare double variables weight = 70.0 and height = 1.75. Compute the BMI and print the result rounded to 1 decimal place.', '22.9', '{\"level1\":\"The formula is: bmi = weight / (height * height)\",\"level2\":\"Use double for all variables to keep decimal precision.\",\"level3\":\"double weight = 70.0;\\ndouble height = 1.75;\\ndouble bmi = weight / (height * height);\\ndouble rounded = Math.round(bmi * 10.0) / 10.0;\\nSystem.out.println(rounded);\"}', NULL, '2026-06-02 10:56:05', '2026-06-02 11:15:11'),
(9, 'Java', 'Variables', 'Easy', 'Advanced', 'Simple Interest Calculator', '<p>Simple interest is the amount earned or paid on a principal amount.</p>\n   <p>Formula: <strong>SI = (Principal × Rate × Time) / 100</strong></p>\n   <p>Use <code>double</code> so the decimal is preserved in the result.</p>', 'Declare double variables principal = 1000.0, rate = 5.0, and time = 3.0. Compute simple interest using the formula and print the result.', '150.0', '{\"level1\":\"The formula is: si = (principal * rate * time) / 100\",\"level2\":\"Use double for all variables: double si = (principal * rate * time) / 100;\",\"level3\":\"double principal = 1000.0;\\ndouble rate = 5.0;\\ndouble time = 3.0;\\ndouble si = (principal * rate * time) / 100;\\nSystem.out.println(si);\"}', NULL, '2026-06-02 10:56:05', '2026-06-02 11:15:11');

-- --------------------------------------------------------

--
-- Table structure for table `quizzes`
--

CREATE TABLE `quizzes` (
  `id` int(11) NOT NULL,
  `lesson_id` int(11) NOT NULL,
  `total_score` int(11) NOT NULL DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `recommendations`
--

CREATE TABLE `recommendations` (
  `id` int(11) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `source_problem_id` bigint(20) UNSIGNED NOT NULL,
  `recommended_problem_id` bigint(20) UNSIGNED NOT NULL,
  `similarity_score` decimal(6,4) DEFAULT 0.0000,
  `explanation` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recommendations`
--

INSERT INTO `recommendations` (`id`, `user_id`, `source_problem_id`, `recommended_problem_id`, `similarity_score`, `explanation`, `created_at`) VALUES
(1, 8, 1, 2, 0.8367, 'Based on your profile (84% match), we recommend you review with a Easy Java Variables exercise.', '2026-06-03 15:43:55'),
(2, 9, 1, 2, 1.0000, 'Based on your profile (100% match), we recommend you continue with a Easy Java Variables exercise.', '2026-06-05 11:16:15');

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

CREATE TABLE `submissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `problem_id` bigint(20) UNSIGNED DEFAULT NULL,
  `language` varchar(50) NOT NULL,
  `concept` varchar(100) NOT NULL,
  `submitted_code` mediumtext NOT NULL,
  `attempts` int(11) NOT NULL DEFAULT 1,
  `time_spent` int(11) NOT NULL DEFAULT 0,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `syntax_errors` int(11) NOT NULL DEFAULT 0,
  `structural_errors` int(11) NOT NULL DEFAULT 0,
  `hint_used` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `submissions`
--

INSERT INTO `submissions` (`id`, `user_id`, `problem_id`, `language`, `concept`, `submitted_code`, `attempts`, `time_spent`, `is_correct`, `created_at`, `syntax_errors`, `structural_errors`, `hint_used`) VALUES
(1, 1, 1, 'Java', 'Variables', '# Task 1: Declare a String Variable\n\nString name = \"John\";\nSystem.out.println(name);', 1, 1039, 0, '2026-06-02 12:01:39', 0, 0, 0),
(2, 8, 1, 'Java', 'Variables', '// Task 1: Declare a String Variable\n\npublic class Main {\n    public static void main(String[] args) {\n        String name = \"John\";\n        System.out.println(name);\n    }\n}', 1, 26, 1, '2026-06-03 15:43:55', 0, 0, 0),
(3, 1, 1, 'Java', 'Variables', '// Task 1: Declare a String Variable\n\n// Write your code here:\nString name= \"John\";\nSystem.out.println(name);', 1, 920, 1, '2026-06-05 10:35:45', 0, 0, 0),
(4, 9, 1, 'Java', 'Variables', '// Task 1: Declare a String Variable\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your code here:\n        System.out.println(\"Replace this line!\");\n    }\n}', 1, 25, 0, '2026-06-05 11:16:15', 0, 0, 0),
(5, 1, 1, 'JavaScript', 'Variables', '// Task 1: The Legend of Python Begins! 🐍\n\nx=10;\nconsole.log(x);\n', 1, 135, 1, '2026-06-05 14:58:36', 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `name` varchar(120) NOT NULL DEFAULT '',
  `photo` text DEFAULT NULL,
  `role` enum('student','admin') NOT NULL DEFAULT 'student',
  `status` enum('active','banned','pending','suspended') NOT NULL DEFAULT 'active',
  `last_login` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `username`, `created_at`, `updated_at`, `name`, `photo`, `role`, `status`, `last_login`) VALUES
(1, 'learner1@codapt.test', '$2a$10$fhMwlec4xKCPsJT4HJ63v.9Zfdl12MccV77J1C81eqFEPUZPsdIIu', 'learner1', '2026-06-02 11:15:10', '2026-06-06 13:19:20', '', NULL, 'student', 'active', NULL),
(2, 'learner2@codapt.test', '$2a$10$/R99xiGjbiz5zzQs8AMvV.YQilHiUWMU81WTy7Qrea7Uu8R2ZeERS', 'learner2', '2026-06-02 11:15:10', '2026-06-06 13:19:20', '', NULL, 'student', 'active', NULL),
(3, 'learner3@codapt.test', '$2a$10$faQneVjw7dS234wQ/zwEHewWnML5eRjxV/lK4zzzrQODFLj1Kv3gC', 'learner3', '2026-06-02 11:15:10', '2026-06-06 13:19:20', '', NULL, 'student', 'active', NULL),
(4, 'user@codapt.com', '$2a$10$5fA0IMr4l7.otM26PjcN0OyRgVAqRqt.989R4hEe8pw4o.Z1Qmq/C', 'user', '2026-06-02 11:20:24', '2026-06-06 13:19:20', '', NULL, 'student', 'active', NULL),
(6, 'user2@codapt.com', '$2a$10$Q2mcMuLoFUcv3XGZd4uLQ.ex303wFmv0638SulifsfmyO7mz70NSq', 'user2', '2026-06-03 14:35:06', '2026-06-03 14:35:06', 'user2', NULL, 'student', 'active', NULL),
(7, 'admin@codapt.com', '$2a$10$22Cr3aF38kAfLhaa6kyyKulvHGqzHT7MvilKZAc2QaUchVq8cKR2u', 'admin', '2026-06-03 15:07:39', '2026-06-03 15:44:19', 'Admin User', NULL, 'admin', 'active', '2026-06-03 23:44:19'),
(8, 'testingacc@test.com', '$2a$10$T9N/eXixQkIZbvmxNZLGF.VZBtnTt4LdgrwQ0Rybu01mmWUOtAPd2', 'testingacc', '2026-06-03 15:43:18', '2026-06-03 15:43:18', 'testingacc', NULL, 'student', 'active', NULL),
(9, 'maryjoy@gmail.com', '$2a$10$xnSYvTFRAJH0U.PEjbyg2OmTrNxPbXlh/ke/RagHDlL2Cv7f5epKm', 'maryjoy', '2026-06-05 11:15:42', '2026-06-06 13:19:20', 'maryjoy', NULL, 'student', 'active', NULL),
(10, 'test1234@codapt.test', '$2a$10$fDYW1P4ot36lYsATbilB8ulikcFEO735VZWFcpXYGdDY/s006fzeC', 'test1234', '2026-06-06 13:21:35', '2026-06-06 13:21:35', 'Test User', NULL, 'student', 'active', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_profiles`
--

CREATE TABLE `user_profiles` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `language` varchar(50) NOT NULL,
  `concept` varchar(100) NOT NULL,
  `total_attempts` int(11) NOT NULL DEFAULT 0,
  `success_rate` double NOT NULL DEFAULT 0,
  `avg_time_spent` double NOT NULL DEFAULT 0,
  `performance_level` varchar(30) NOT NULL DEFAULT 'Beginner',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tasks_completed` int(11) NOT NULL DEFAULT 0,
  `total_tasks` int(11) NOT NULL DEFAULT 0,
  `avg_attempts` decimal(8,2) NOT NULL DEFAULT 0.00,
  `syntax_errors` int(11) NOT NULL DEFAULT 0,
  `structural_errors` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_profiles`
--

INSERT INTO `user_profiles` (`id`, `user_id`, `language`, `concept`, `total_attempts`, `success_rate`, `avg_time_spent`, `performance_level`, `created_at`, `updated_at`, `tasks_completed`, `total_tasks`, `avg_attempts`, `syntax_errors`, `structural_errors`) VALUES
(1, 1, 'Java', 'Variables', 7, 0.7250000000000001, 286.125, 'Intermediate', '2026-06-02 11:15:10', '2026-06-05 10:35:45', 0, 0, 0.00, 0, 0),
(2, 2, 'Java', 'Variables', 4, 0.55, 90, 'Intermediate', '2026-06-02 11:15:10', '2026-06-02 11:15:10', 0, 0, 0.00, 0, 0),
(3, 3, 'Java', 'Variables', 2, 0.2, 130, 'Beginner', '2026-06-02 11:15:10', '2026-06-02 11:15:10', 0, 0, 0.00, 0, 0),
(4, 8, 'Java', 'Variables', 1, 1, 26, 'Hard', '2026-06-03 15:43:55', '2026-06-03 15:43:55', 1, 9, 1.00, 0, 0),
(5, 9, 'Java', 'Variables', 1, 0, 25, 'Easy', '2026-06-05 11:16:15', '2026-06-05 11:16:15', 0, 9, 1.00, 0, 0),
(6, 1, 'JavaScript', 'Variables', 1, 1, 135, 'Intermediate', '2026-06-05 14:58:36', '2026-06-05 14:58:36', 0, 0, 0.00, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `user_progress`
--

CREATE TABLE `user_progress` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `language` varchar(50) NOT NULL,
  `concept` varchar(100) NOT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT 0,
  `completed_at` timestamp NULL DEFAULT NULL,
  `last_attempt_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_progress`
--

INSERT INTO `user_progress` (`id`, `user_id`, `language`, `concept`, `completed`, `completed_at`, `last_attempt_at`) VALUES
(1, 1, 'Java', 'Variables', 0, '2026-06-02 11:15:10', '2026-06-02 12:01:39'),
(2, 2, 'Java', 'Variables', 1, '2026-06-02 11:15:10', '2026-06-02 11:15:10'),
(4, 3, 'Java', 'Variables', 0, NULL, '2026-06-02 11:15:10');

-- --------------------------------------------------------

--
-- Table structure for table `user_scores`
--

CREATE TABLE `user_scores` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `language` varchar(50) NOT NULL,
  `concept` varchar(100) NOT NULL,
  `score` decimal(5,2) NOT NULL DEFAULT 0.00,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_scores`
--

INSERT INTO `user_scores` (`id`, `user_id`, `language`, `concept`, `score`, `submitted_at`) VALUES
(1, 1, 'Java', 'Variables', 92.00, '2026-05-31 11:15:10'),
(2, 2, 'Java', 'Variables', 68.00, '2026-05-28 11:15:10'),
(3, 3, 'Java', 'Variables', 30.00, '2026-06-01 11:15:10'),
(4, 1, 'Java', 'Variables', 0.00, '2026-06-02 12:01:39');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `achievements`
--
ALTER TABLE `achievements`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_activity_logs_user_id` (`user_id`),
  ADD KEY `idx_activity_logs_created_at` (`created_at`);

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `admin_settings`
--
ALTER TABLE `admin_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indexes for table `daily_progress`
--
ALTER TABLE `daily_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ux_user_date` (`user_id`,`progress_date`);

--
-- Indexes for table `lessons`
--
ALTER TABLE `lessons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lessons_module_id` (`module_id`);

--
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `problems`
--
ALTER TABLE `problems`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_problem` (`language`,`concept`,`difficulty`,`problem_tier`,`title`);

--
-- Indexes for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_quizzes_lesson_id` (`lesson_id`);

--
-- Indexes for table `recommendations`
--
ALTER TABLE `recommendations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_submissions_user_id` (`user_id`),
  ADD KEY `idx_submissions_problem_id` (`problem_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_users_email` (`email`);

--
-- Indexes for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_profiles` (`user_id`,`language`,`concept`),
  ADD KEY `idx_user_profiles_user_id` (`user_id`);

--
-- Indexes for table `user_progress`
--
ALTER TABLE `user_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_progress` (`user_id`,`language`,`concept`),
  ADD KEY `idx_user_progress_user_id` (`user_id`),
  ADD KEY `idx_user_progress_completed_at` (`completed_at`);

--
-- Indexes for table `user_scores`
--
ALTER TABLE `user_scores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_scores_user_id` (`user_id`),
  ADD KEY `idx_user_scores_submitted_at` (`submitted_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `achievements`
--
ALTER TABLE `achievements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `activities`
--
ALTER TABLE `activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_settings`
--
ALTER TABLE `admin_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `daily_progress`
--
ALTER TABLE `daily_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `lessons`
--
ALTER TABLE `lessons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `modules`
--
ALTER TABLE `modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `problems`
--
ALTER TABLE `problems`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `quizzes`
--
ALTER TABLE `quizzes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `recommendations`
--
ALTER TABLE `recommendations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `user_progress`
--
ALTER TABLE `user_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `user_scores`
--
ALTER TABLE `user_scores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `fk_submissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD CONSTRAINT `fk_user_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
