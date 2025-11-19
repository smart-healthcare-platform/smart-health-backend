-- Migration: Create user_devices table
-- Created: 2024-01-15
-- Description: Table to store FCM device tokens for push notifications

CREATE TABLE IF NOT EXISTS user_devices (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  device_token TEXT NOT NULL,
  device_type ENUM('web', 'android', 'ios') NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_user_active (user_id, is_active),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add unique constraint to prevent duplicate tokens for same user
-- Note: Using HASH for TEXT column in unique index
ALTER TABLE user_devices 
ADD UNIQUE KEY unique_user_device (user_id, device_token(255));