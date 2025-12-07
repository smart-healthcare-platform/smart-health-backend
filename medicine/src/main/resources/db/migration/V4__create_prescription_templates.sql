-- Migration: Create prescription template tables
-- Phase 3C: Prescription Templates
-- Date: 2024-12-01

-- Table: prescription_templates
CREATE TABLE IF NOT EXISTS prescription_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id VARCHAR(100) NOT NULL,
    template_name VARCHAR(200) NOT NULL,
    diagnosis VARCHAR(500),
    notes VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_template_name (template_name),
    INDEX idx_updated_at (updated_at),
    
    -- Constraints
    UNIQUE KEY uk_doctor_template (doctor_id, template_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Prescription templates for doctors';

-- Table: prescription_template_items
CREATE TABLE IF NOT EXISTS prescription_template_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_id BIGINT NOT NULL,
    drug_id BIGINT NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    route VARCHAR(50),
    timing VARCHAR(100),
    duration_days INT,
    special_instructions VARCHAR(500),
    
    -- Foreign Keys
    CONSTRAINT fk_template_item_template 
        FOREIGN KEY (template_id) 
        REFERENCES prescription_templates(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_template_item_drug 
        FOREIGN KEY (drug_id) 
        REFERENCES drug(id),
    
    -- Indexes
    INDEX idx_template_id (template_id),
    INDEX idx_drug_id (drug_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Items in prescription templates';

-- Sample data (optional - uncomment to insert sample templates)
/*
-- Sample template for common cold
INSERT INTO prescription_templates (doctor_id, template_name, diagnosis, notes)
VALUES ('DOC001', 'Đơn cảm cúm thông thường', 'Nhiễm khuẩn đường hô hấp trên', 'Uống sau ăn, nghỉ ngơi đầy đủ');

SET @template_id = LAST_INSERT_ID();

-- Assuming drug IDs exist in drugs table
INSERT INTO prescription_template_items (template_id, drug_id, dosage, frequency, route, timing, duration_days)
VALUES 
(@template_id, 1, '1 viên', '3 lần/ngày', 'Uống', 'Sau ăn 30 phút', 7),
(@template_id, 2, '5ml', '2 lần/ngày', 'Uống', 'Sáng và tối', 5);
*/

-- Verification queries
-- Count templates per doctor
-- SELECT doctor_id, COUNT(*) as template_count 
-- FROM prescription_templates 
-- GROUP BY doctor_id;

-- List all templates with item count
-- SELECT 
--     t.id,
--     t.doctor_id,
--     t.template_name,
--     t.diagnosis,
--     COUNT(ti.id) as total_drugs,
--     t.created_at,
--     t.updated_at
-- FROM prescription_templates t
-- LEFT JOIN prescription_template_items ti ON t.id = ti.template_id
-- GROUP BY t.id
-- ORDER BY t.updated_at DESC;
