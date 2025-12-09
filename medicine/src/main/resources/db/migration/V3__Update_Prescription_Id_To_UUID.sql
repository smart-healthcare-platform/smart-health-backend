-- Drop foreign key constraint to allow changing the id column type
ALTER TABLE prescription_item DROP FOREIGN KEY prescription_item_ibfk_1;

-- Update charset and collation for prescription table's primary key
ALTER TABLE prescription CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Ensure prescription_item.prescription_id column matches with proper charset
ALTER TABLE prescription_item MODIFY COLUMN prescription_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Recreate the foreign key constraint
ALTER TABLE prescription_item ADD CONSTRAINT prescription_item_ibfk_1 
    FOREIGN KEY (prescription_id) REFERENCES prescription (id);

-- Update other columns to ensure proper charset and collation
ALTER TABLE prescription MODIFY COLUMN patient_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE prescription MODIFY COLUMN doctor_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE prescription MODIFY COLUMN appointment_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE prescription MODIFY COLUMN diagnosis VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE prescription MODIFY COLUMN status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE prescription MODIFY COLUMN notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Update drug table columns
ALTER TABLE drug CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE drug MODIFY COLUMN name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE drug MODIFY COLUMN active_ingredient VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE drug MODIFY COLUMN strength VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Update prescription_item table columns
ALTER TABLE prescription_item MODIFY COLUMN dosage VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE prescription_item MODIFY COLUMN frequency VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE prescription_item MODIFY COLUMN route VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE prescription_item MODIFY COLUMN timing VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;