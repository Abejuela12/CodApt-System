-- Database schema for CodApt backend integration
-- Run this in phpMyAdmin or MySQL shell if tables are missing.

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  username VARCHAR(80) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','admin') NOT NULL DEFAULT 'student',
  status ENUM('active','banned','pending','suspended') NOT NULL DEFAULT 'active',
  photo TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login DATETIME NULL,
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  language VARCHAR(80) NOT NULL,
  concept VARCHAR(120) NOT NULL,
  difficulty ENUM('Easy','Intermediate','Hard') NOT NULL DEFAULT 'Easy',
  problem_tier ENUM('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',
  instruction TEXT,
  expected_output TEXT,
  required_construct VARCHAR(255) DEFAULT NULL,
  hints JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_problem_language (language),
  INDEX idx_problem_concept (concept)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS submissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  problem_id BIGINT UNSIGNED DEFAULT NULL,
  language VARCHAR(80) NOT NULL,
  concept VARCHAR(120) NOT NULL,
  submitted_code MEDIUMTEXT,
  attempts INT NOT NULL DEFAULT 0,
  time_spent INT NOT NULL DEFAULT 0,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  syntax_errors INT NOT NULL DEFAULT 0,
  structural_errors INT NOT NULL DEFAULT 0,
  hint_used TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_profiles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  language VARCHAR(80) NOT NULL,
  concept VARCHAR(120) NOT NULL,
  total_attempts INT NOT NULL DEFAULT 0,
  tasks_completed INT NOT NULL DEFAULT 0,
  total_tasks INT NOT NULL DEFAULT 0,
  success_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  avg_time_spent DECIMAL(8,2) NOT NULL DEFAULT 0,
  avg_attempts DECIMAL(8,2) NOT NULL DEFAULT 0,
  syntax_errors INT NOT NULL DEFAULT 0,
  structural_errors INT NOT NULL DEFAULT 0,
  performance_level ENUM('Easy','Intermediate','Hard') NOT NULL DEFAULT 'Easy',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_language_concept (user_id, language, concept),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS daily_progress (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  language VARCHAR(80) NOT NULL,
  progress_date DATE NOT NULL,
  score INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_daily_user_date (user_id, language, progress_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recommendations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  source_problem_id BIGINT UNSIGNED NOT NULL,
  recommended_problem_id BIGINT UNSIGNED NOT NULL,
  similarity_score DECIMAL(6,4) NOT NULL DEFAULT 0,
  explanation TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  role VARCHAR(50) DEFAULT 'admin',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  language VARCHAR(80) NOT NULL,
  concept VARCHAR(120) NOT NULL,
  difficulty ENUM('Easy','Intermediate','Hard') NOT NULL DEFAULT 'Easy',
  problem_tier ENUM('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',
  instruction TEXT,
  expected_output TEXT,
  required_construct VARCHAR(255) DEFAULT NULL,
  hints JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lessons_language (language),
  INDEX idx_lessons_concept (concept)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS activities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  activity_type VARCHAR(255),
  details TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  log_level VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  metadata JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS achievements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  earned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
