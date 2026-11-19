USE `placement_db`;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `round_results`;
TRUNCATE TABLE `rounds`;
TRUNCATE TABLE `applications`;
TRUNCATE TABLE `drives`;
TRUNCATE TABLE `companies`;
TRUNCATE TABLE `students`;
TRUNCATE TABLE `users`;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO `users` (`id`, `email`, `password_hash`, `role`) VALUES
(1, 'admin@college.edu', '$2b$10$qXanbws7f.eHmm/DwnVeRe45Mxj2FyKM0LIL.gy2tsmXrYV6KtzbK', 'admin'),
(2, 'rahul.sharma@college.edu', '$2b$10$EPBh7urYOizg4Sn/wDG98OsLnmx755MO.HkY2bIT.LiDJR0cYcA2u', 'student'),
(3, 'priya.patel@college.edu',  '$2b$10$EPBh7urYOizg4Sn/wDG98OsLnmx755MO.HkY2bIT.LiDJR0cYcA2u', 'student'),
(4, 'amit.verma@college.edu',   '$2b$10$EPBh7urYOizg4Sn/wDG98OsLnmx755MO.HkY2bIT.LiDJR0cYcA2u', 'student'),
(5, 'sneha.gupta@college.edu',  '$2b$10$EPBh7urYOizg4Sn/wDG98OsLnmx755MO.HkY2bIT.LiDJR0cYcA2u', 'student'),
(6, 'vikram.singh@college.edu', '$2b$10$EPBh7urYOizg4Sn/wDG98OsLnmx755MO.HkY2bIT.LiDJR0cYcA2u', 'student'),
(7, 'recruiter@google.com',     '$2b$10$pzD9HhiFwuVOgI5E1UTJDOosC7jt53OhdniRCa18MMUQHCxWYxoNS', 'company'),
(8, 'hr@infosys.com',           '$2b$10$pzD9HhiFwuVOgI5E1UTJDOosC7jt53OhdniRCa18MMUQHCxWYxoNS', 'company'),
(9, 'jobs@startuphub.ai',       '$2b$10$pzD9HhiFwuVOgI5E1UTJDOosC7jt53OhdniRCa18MMUQHCxWYxoNS', 'company');

INSERT INTO `students` (`id`, `user_id`, `name`, `enrollment_no`, `branch`, `cgpa`, `backlogs`, `skills`, `resume_url`) VALUES
(1, 2, 'Rahul Sharma', '0801CS211001', 'CSE', 8.85, 0, 'JavaScript, HTML, CSS, Node.js, MySQL, Python, Data Structures', '/uploads/resumes/sample-resume-rahul.pdf'),
(2, 3, 'Priya Patel',  '0801IT211002', 'IT',  9.10, 0, 'Java, Spring Boot, MySQL, AWS, Docker', '/uploads/resumes/sample-resume-priya.pdf'),
(3, 4, 'Amit Verma',   '0801EC211003', 'ECE', 7.20, 1, 'Embedded C, IoT, Python, Circuit Design', NULL),
(4, 5, 'Sneha Gupta',  '0801CS211004', 'CSE', 6.40, 2, 'HTML, CSS, JavaScript, Basic SQL', NULL),
(5, 6, 'Vikram Singh', '0801ME211005', 'MECH', 7.90, 0, 'AutoCAD, SolidWorks, MATLAB, Thermodynamics', NULL);

INSERT INTO `companies` (`id`, `user_id`, `name`, `industry`, `website`, `approved`) VALUES
(1, 7, 'Google India',  'Technology / Cloud / AI',  'https://careers.google.com', 1),
(2, 8, 'Infosys BPM',   'IT Consulting & Services', 'https://infosys.com',        1),
(3, 9, 'StartupHub AI', 'FinTech & Machine Learning','https://startuphub.ai',     0);

INSERT INTO `drives` (`id`, `company_id`, `title`, `description`, `package_lpa`, `min_cgpa`, `allowed_branches`, `max_backlogs`, `deadline`, `status`) VALUES
(1, 1, 'Associate Software Engineer - 2026 Batch',
 'Opportunity to work on scalable distributed systems, cloud infrastructure, and large language models at Google Bangalore/Hyderabad.',
 18.50, 7.50, 'CSE,IT', 0, '2026-12-31 23:59:59', 'open'),
(2, 2, 'Specialist Programmer / Systems Engineer',
 'Focus on enterprise application development, automation, and full-stack solutions with premier global clients.',
 9.50, 6.50, 'CSE,IT,ECE', 1, '2026-12-15 23:59:59', 'open');

INSERT INTO `rounds` (`id`, `drive_id`, `round_no`, `round_name`, `round_date`) VALUES
(1, 1, 1, 'Online Coding & DSA Assessment', '2026-11-20 10:00:00'),
(2, 1, 2, 'Technical System Design Interview', '2026-11-25 14:00:00'),
(3, 1, 3, 'HR & Behavioral Fitment', '2026-11-28 16:00:00'),
(4, 2, 1, 'Aptitude & Technical MCQ', '2026-11-22 11:00:00'),
(5, 2, 2, 'Technical Coding & Managerial Round', '2026-11-26 15:00:00');

INSERT INTO `applications` (`id`, `drive_id`, `student_id`, `status`, `applied_at`) VALUES
(1, 1, 1, 'selected',    '2026-11-18 09:30:00'),
(2, 1, 2, 'shortlisted', '2026-11-18 10:15:00'),
(3, 2, 3, 'applied',     '2026-11-18 11:00:00');

INSERT INTO `round_results` (`application_id`, `round_id`, `result`, `feedback`) VALUES
(1, 1, 'pass', 'Scored 100% on algorithm problems'),
(1, 2, 'pass', 'Excellent knowledge of REST APIs and system scalability'),
(1, 3, 'pass', 'Strong cultural fit and communication skills'),
(2, 1, 'pass', 'Cleared with 92% score in DSA assessment');
