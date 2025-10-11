CREATE TABLE drug
(
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    name               VARCHAR(255) NOT NULL,
    active_ingredient  VARCHAR(255),
    strength           VARCHAR(255),
    stock_status       VARCHAR(50)
);

CREATE TABLE prescription
(
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id      VARCHAR(36),
    doctor_id       VARCHAR(36),
    appointment_id  VARCHAR(36),
    diagnosis       VARCHAR(255),
    status      VARCHAR(50),
    notes       TEXT,
    created_at  DATETIME
);

CREATE TABLE prescription_item
(
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id   BIGINT,
    drug_id           BIGINT,
    dosage            VARCHAR(255),
    frequency         VARCHAR(255),
    route             VARCHAR(255),
    timing            VARCHAR(255),
    duration_days     INT,
    FOREIGN KEY (prescription_id) REFERENCES prescription (id),
    FOREIGN KEY (drug_id) REFERENCES drug (id)
);