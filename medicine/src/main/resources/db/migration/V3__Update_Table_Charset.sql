-- Update charset and collation for all tables to support full UTF-8 (including emojis)
ALTER TABLE drug CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE prescription CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE prescription_item CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Update specific columns that might have length issues for Vietnamese text
ALTER TABLE prescription_item MODIFY COLUMN dosage VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE prescription_item MODIFY COLUMN frequency VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE prescription_item MODIFY COLUMN route VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE prescription_item MODIFY COLUMN timing VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Update columns in prescription table if needed
ALTER TABLE prescription MODIFY COLUMN diagnosis TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE prescription MODIFY COLUMN notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Update columns in drug table if needed
ALTER TABLE drug MODIFY COLUMN name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE drug MODIFY COLUMN active_ingredient VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE drug MODIFY COLUMN strength VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;