CREATE DATABASE IF NOT EXISTS `placement_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `placement_db`;

DROP TABLE IF EXISTS `round_results`;
DROP TABLE IF EXISTS `rounds`;
DROP TABLE IF EXISTS `applications`;
DROP TABLE IF EXISTS `drives`;
DROP TABLE IF EXISTS `companies`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'student', 'company') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `enrollment_no` VARCHAR(100) NOT NULL UNIQUE,
  `branch` VARCHAR(100) NOT NULL,
  `cgpa` DECIMAL(4, 2) NOT NULL,
  `backlogs` INT NOT NULL DEFAULT 0,
  `skills` TEXT DEFAULT NULL,
  `resume_url` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `companies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `industry` VARCHAR(255) DEFAULT NULL,
  `website` VARCHAR(255) DEFAULT NULL,
  `approved` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_companies_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `drives` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `package_lpa` DECIMAL(5, 2) NOT NULL,
  `min_cgpa` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
  `allowed_branches` VARCHAR(255) NOT NULL,
  `max_backlogs` INT NOT NULL DEFAULT 0,
  `deadline` DATETIME NOT NULL,
  `status` ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_drives_company` FOREIGN KEY (`company_id`)
    REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `applications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `drive_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `status` ENUM('applied', 'shortlisted', 'rejected', 'selected') NOT NULL DEFAULT 'applied',
  `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `unique_student_drive` UNIQUE (`drive_id`, `student_id`),
  CONSTRAINT `fk_app_drive` FOREIGN KEY (`drive_id`)
    REFERENCES `drives` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_app_student` FOREIGN KEY (`student_id`)
    REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `rounds` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `drive_id` INT NOT NULL,
  `round_no` INT NOT NULL,
  `round_name` VARCHAR(255) NOT NULL,
  `round_date` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_rounds_drive` FOREIGN KEY (`drive_id`)
    REFERENCES `drives` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `round_results` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `application_id` INT NOT NULL,
  `round_id` INT NOT NULL,
  `result` ENUM('pass', 'fail', 'pending') NOT NULL DEFAULT 'pending',
  `feedback` TEXT DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `unique_app_round` UNIQUE (`application_id`, `round_id`),
  CONSTRAINT `fk_res_application` FOREIGN KEY (`application_id`)
    REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_res_round` FOREIGN KEY (`round_id`)
    REFERENCES `rounds` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX `idx_students_branch` ON `students` (`branch`);
CREATE INDEX `idx_students_cgpa` ON `students` (`cgpa`);
CREATE INDEX `idx_drives_deadline` ON `drives` (`deadline`);
CREATE INDEX `idx_drives_status` ON `drives` (`status`);
CREATE INDEX `idx_app_status` ON `applications` (`status`);
