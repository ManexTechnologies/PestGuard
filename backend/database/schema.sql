-- PestGuard Database Schema for XAMPP/MySQL

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS pestguard;
USE pestguard;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Farmer profiles table
CREATE TABLE IF NOT EXISTS farmer_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    province VARCHAR(100),
    district VARCHAR(100),
    farm_size DECIMAL(10, 2),
    crops_grown JSON,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Pest sightings table
CREATE TABLE IF NOT EXISTS pest_sightings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    pest_name VARCHAR(255) NOT NULL,
    pest_type VARCHAR(100),
    severity VARCHAR(50),
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    image_url VARCHAR(500),
    description TEXT,
    identified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_identified_at (identified_at)
);

-- Pest history/records table
CREATE TABLE IF NOT EXISTS pest_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    sighting_id INT,
    action_taken VARCHAR(255),
    treatment_used VARCHAR(255),
    effectiveness VARCHAR(50),
    result TEXT,
    treated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sighting_id) REFERENCES pest_sightings(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id)
);

-- Knowledge base articles table
CREATE TABLE IF NOT EXISTS knowledge_base (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    pest_type VARCHAR(100),
    content LONGTEXT,
    symptoms JSON,
    prevention JSON,
    treatment JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pest_type (pest_type)
);

-- Emergency alerts table
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    alert_type VARCHAR(100),
    severity VARCHAR(50),
    location VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);
