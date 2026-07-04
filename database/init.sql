CREATE DATABASE IF NOT EXISTS chat_db;
USE chat_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    request_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tokens_used INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert a default test user (password is 'password' - in real app this should be hashed, but for simple login we'll keep it simple or hash it in Node.js)
-- Actually, let's just use simple plain text for the "simple login" requirement to avoid overcomplicating, or we can use a simple hash.
-- For simplicity as requested "Login sederhana", we'll use plain text in this practice project.
INSERT INTO users (username, password) VALUES ('admin', 'admin123') ON DUPLICATE KEY UPDATE id=id;
