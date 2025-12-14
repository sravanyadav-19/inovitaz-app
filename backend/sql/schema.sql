-- sql/schema.sql
-- ============================================
-- Inovitaz Database Schema - Complete Version
-- ============================================

CREATE DATABASE IF NOT EXISTS inovitaz_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inovitaz_db;

-- ============================================
-- DROP ALL TABLES IN CORRECT ORDER
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS coupon_usage;
DROP TABLE IF EXISTS download_logs;
DROP TABLE IF EXISTS wishlist;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS payments;  -- Old table
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

-- Drop views if exist
DROP VIEW IF EXISTS project_stats;
DROP VIEW IF EXISTS user_purchases;

-- Drop triggers if exist
DROP TRIGGER IF EXISTS update_project_rating_after_review;
DROP TRIGGER IF EXISTS update_project_rating_after_review_update;
DROP TRIGGER IF EXISTS update_project_rating_after_review_delete;
DROP TRIGGER IF EXISTS increment_coupon_usage;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- CORE TABLES
-- ============================================

-- Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  name VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projects Table (ENHANCED)
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price INT NOT NULL DEFAULT 49900, -- price in paise (₹499)
  thumbnail VARCHAR(512),
  content_url VARCHAR(1024),
  category VARCHAR(100) DEFAULT 'IoT',
  difficulty ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  reviews_count INT DEFAULT 0,
  features TEXT, -- JSON array
  tech_stack TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_difficulty (difficulty),
  INDEX idx_rating (average_rating),
  INDEX idx_price (price),
  FULLTEXT idx_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders Table (ENHANCED)
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_id INT NOT NULL,
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  amount INT NOT NULL,
  original_amount INT DEFAULT NULL, -- amount before discount
  discount_amount INT DEFAULT 0,
  coupon_code VARCHAR(50) DEFAULT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status ENUM('created', 'paid', 'failed') DEFAULT 'created',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_project (project_id),
  INDEX idx_status (status),
  INDEX idx_razorpay_order (razorpay_order_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NEW FEATURE TABLES
-- ============================================

-- Coupons Table
CREATE TABLE coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase_amount INT DEFAULT 0, -- in paise
  max_discount_amount INT DEFAULT NULL, -- in paise
  usage_limit INT DEFAULT NULL,
  used_count INT DEFAULT 0,
  valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
  valid_until DATETIME DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_active (is_active),
  INDEX idx_valid_until (valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews Table
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  order_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_project_review (user_id, project_id),
  INDEX idx_project (project_id),
  INDEX idx_user (user_id),
  INDEX idx_rating (rating),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wishlist Table
CREATE TABLE wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_project (user_id, project_id),
  INDEX idx_user (user_id),
  INDEX idx_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Download Logs Table
CREATE TABLE download_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_id INT NOT NULL,
  order_id INT NOT NULL,
  download_count INT DEFAULT 0,
  max_downloads INT DEFAULT 5,
  expiry_date DATETIME NOT NULL,
  last_downloaded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_project_order (user_id, project_id, order_id),
  INDEX idx_user_project (user_id, project_id),
  INDEX idx_expiry (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Coupon Usage Table
CREATE TABLE coupon_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coupon_id INT NOT NULL,
  user_id INT NOT NULL,
  order_id INT NOT NULL,
  discount_amount INT NOT NULL, -- in paise
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_coupon (coupon_id),
  INDEX idx_user (user_id),
  INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED DATA
-- ============================================

-- Admin User (password: admin123)
INSERT INTO users (email, password, role, name) VALUES
('admin@local', '$2a$10$7u7f5H1nG6l1y3P0/1qXfuVwYvX5bKf/7dTq9C3k8WqJp3yHqGqW6', 'admin', 'Admin User');

-- Sample Projects (ENHANCED)
INSERT INTO projects (title, description, price, category, difficulty, thumbnail, features, tech_stack) VALUES
(
  'Automated Plant Watering System',
  '{"overview": "Soil moisture-based irrigation with mobile monitoring. Complete guide with circuit diagrams and code.", "components": "Arduino Uno\nSoil Moisture Sensor\nWater Pump\nRelay Module\nJumper Wires", "circuitText": "Connect soil moisture sensor to A0 pin. Relay to pin 7. Power supply 5V.", "steps": "1. Assemble circuit\n2. Upload code\n3. Calibrate sensor\n4. Test system", "download_url": "https://drive.google.com/file/d/example"}',
  49900,
  'IoT',
  'Beginner',
  'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400',
  '["Automatic Watering", "Soil Monitoring", "Mobile Alerts"]',
  '["Arduino", "C++", "IoT"]'
),
(
  'IoT Weather Monitoring Station',
  '{"overview": "Real-time weather monitoring with cloud-based dashboard and docs.", "components": "ESP32\nDHT22 Sensor\nBMP280 Sensor\nOLED Display", "circuitText": "DHT22 to GPIO 4, BMP280 to I2C pins, OLED to I2C", "steps": "1. Wire components\n2. Configure WiFi\n3. Deploy to cloud\n4. Setup dashboard", "download_url": "https://drive.google.com/file/d/example2"}',
  49900,
  'IoT',
  'Intermediate',
  'https://images.unsplash.com/photo-1592210454359-9043f067919b?w=400',
  '["Cloud Integration", "Real-time Data", "Mobile Dashboard"]',
  '["ESP32", "Arduino", "ThingSpeak"]'
),
(
  'Smart Home Automation System',
  '{"overview": "Complete IoT home automation with mobile control and docs.", "components": "NodeMCU\n4 Channel Relay\nIR Sensor\nLEDs\nBreadboard", "circuitText": "Relay channels to D1-D4 pins. IR sensor to D5.", "steps": "1. Setup hardware\n2. Install Blynk app\n3. Configure devices\n4. Test automation", "download_url": "https://drive.google.com/file/d/example3"}',
  49900,
  'IoT',
  'Advanced',
  'https://images.unsplash.com/photo-1558002038-1055907df827?w=400',
  '["Voice Control", "Remote Access", "Scheduling"]',
  '["NodeMCU", "Blynk", "Firebase"]'
),
(
  'Smart Parking System',
  '{"overview": "Automated parking slot detection with mobile app integration.", "components": "Arduino Mega\nUltrasonic Sensors (4x)\nServo Motor\nLCD Display", "circuitText": "Ultrasonic sensors to digital pins 2,4,6,8. Servo to pin 9.", "steps": "1. Mount sensors\n2. Calibrate distances\n3. Setup display\n4. Test detection", "download_url": "https://drive.google.com/file/d/example4"}',
  39900,
  'Arduino',
  'Intermediate',
  'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400',
  '["Real-time Status", "Auto Gate Control", "Mobile App"]',
  '["Arduino", "Bluetooth", "MIT App Inventor"]'
),
(
  'Line Following Robot',
  '{"overview": "Autonomous robot that follows black line using IR sensors.", "components": "Arduino Uno\nL293D Motor Driver\nDC Motors (2x)\nIR Sensors (5x)\nWheels\nChassis", "circuitText": "IR sensors to pins 2-6. Motor driver connections to pins 8-11.", "steps": "1. Assemble robot\n2. Calibrate sensors\n3. Upload code\n4. Test on track", "download_url": "https://drive.google.com/file/d/example5"}',
  29900,
  'Robotics',
  'Beginner',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400',
  '["PID Control", "Obstacle Detection", "Speed Control"]',
  '["Arduino", "Robotics", "C++"]'
),
(
  'Raspberry Pi Media Center',
  '{"overview": "Turn your Pi into a complete media streaming center with Kodi.", "components": "Raspberry Pi 4\nMicroSD Card (32GB)\nHDMI Cable\nPower Supply\nRemote Control", "circuitText": "Connect Pi to TV via HDMI. Power via USB-C.", "steps": "1. Install Kodi OS\n2. Configure network\n3. Add media sources\n4. Setup remote", "download_url": "https://drive.google.com/file/d/example6"}',
  59900,
  'Raspberry Pi',
  'Beginner',
  'https://images.unsplash.com/photo-1551817958-20ebe528f0f6?w=400',
  '["4K Streaming", "Voice Control", "NAS Integration"]',
  '["Raspberry Pi", "Kodi", "Python"]'
);

-- Sample Coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, valid_until) VALUES
('FIRST20', '20% off for first-time buyers', 'percentage', 20.00, 0, 10000, 100, DATE_ADD(NOW(), INTERVAL 3 MONTH)),
('SAVE50', '₹50 off on any project', 'fixed', 50.00, 20000, NULL, 200, DATE_ADD(NOW(), INTERVAL 2 MONTH)),
('STUDENT25', '25% student discount', 'percentage', 25.00, 0, 15000, 500, DATE_ADD(NOW(), INTERVAL 6 MONTH)),
('WELCOME100', 'Welcome offer - ₹100 off', 'fixed', 100.00, 50000, NULL, 50, DATE_ADD(NOW(), INTERVAL 1 MONTH)),
('FLASH30', 'Flash sale - 30% off', 'percentage', 30.00, 30000, 20000, 1000, DATE_ADD(NOW(), INTERVAL 7 DAY));

-- ============================================
-- USEFUL VIEWS
-- ============================================

-- Project Statistics View
CREATE VIEW project_stats AS
SELECT 
  p.id,
  p.title,
  p.category,
  p.price,
  p.difficulty,
  p.average_rating,
  p.reviews_count,
  COUNT(DISTINCT o.id) as total_sales,
  COUNT(DISTINCT w.id) as wishlist_count,
  SUM(CASE WHEN o.status = 'paid' THEN o.amount ELSE 0 END) as total_revenue
FROM projects p
LEFT JOIN orders o ON p.id = o.project_id
LEFT JOIN wishlist w ON p.id = w.project_id
GROUP BY p.id;

-- User Purchase History View
CREATE VIEW user_purchases AS
SELECT 
  o.id as order_id,
  o.user_id,
  u.name as user_name,
  u.email,
  o.project_id,
  p.title as project_title,
  p.category,
  p.thumbnail,
  o.amount,
  o.original_amount,
  o.discount_amount,
  o.coupon_code,
  o.status,
  o.created_at as purchased_at,
  dl.download_count,
  dl.max_downloads,
  (dl.max_downloads - dl.download_count) as downloads_remaining,
  dl.expiry_date,
  dl.last_downloaded_at
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN projects p ON o.project_id = p.id
LEFT JOIN download_logs dl ON o.id = dl.order_id
WHERE o.status = 'paid';

-- ============================================
-- TRIGGERS
-- ============================================

DELIMITER $$

-- Update project rating when review added
CREATE TRIGGER update_project_rating_after_review
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  UPDATE projects 
  SET 
    average_rating = (SELECT AVG(rating) FROM reviews WHERE project_id = NEW.project_id),
    reviews_count = (SELECT COUNT(*) FROM reviews WHERE project_id = NEW.project_id)
  WHERE id = NEW.project_id;
END$$

-- Update project rating when review updated
CREATE TRIGGER update_project_rating_after_review_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
  UPDATE projects 
  SET 
    average_rating = (SELECT AVG(rating) FROM reviews WHERE project_id = NEW.project_id),
    reviews_count = (SELECT COUNT(*) FROM reviews WHERE project_id = NEW.project_id)
  WHERE id = NEW.project_id;
END$$

-- Update project rating when review deleted
CREATE TRIGGER update_project_rating_after_review_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
  UPDATE projects 
  SET 
    average_rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE project_id = OLD.project_id), 0),
    reviews_count = (SELECT COUNT(*) FROM reviews WHERE project_id = OLD.project_id)
  WHERE id = OLD.project_id;
END$$

-- Increment coupon usage count
CREATE TRIGGER increment_coupon_usage
AFTER INSERT ON coupon_usage
FOR EACH ROW
BEGIN
  UPDATE coupons 
  SET used_count = used_count + 1
  WHERE id = NEW.coupon_id;
END$$

DELIMITER ;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_project_status ON orders(project_id, status);
CREATE INDEX idx_reviews_project_rating ON reviews(project_id, rating);

-- ============================================
-- SCHEMA COMPLETE
-- ============================================

SELECT '✅ Database schema created successfully!' as status;
SELECT CONCAT('📊 Total projects: ', COUNT(*)) as info FROM projects;
SELECT CONCAT('🎫 Total coupons: ', COUNT(*)) as info FROM coupons;
SELECT CONCAT('👤 Admin user created: admin@local (password: admin123)') as info;