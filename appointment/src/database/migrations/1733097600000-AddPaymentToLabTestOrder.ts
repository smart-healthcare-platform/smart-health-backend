import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add payment tracking fields to lab_test_orders table
 * - payment_id: Links to Payment in Billing Service
 * - lab_test_id: Foreign key to lab_tests table for price lookup
 */
export class AddPaymentToLabTestOrder1733097600000
  implements MigrationInterface
{
  name = 'AddPaymentToLabTestOrder1733097600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add payment_id column to track payment status
    await queryRunner.query(`
      ALTER TABLE lab_test_orders 
      ADD COLUMN payment_id VARCHAR(255) NULL
    `);

    // Add lab_test_id column as foreign key to lab_tests
    await queryRunner.query(`
      ALTER TABLE lab_test_orders 
      ADD COLUMN lab_test_id UUID NULL
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE lab_test_orders 
      ADD CONSTRAINT fk_lab_test_order_lab_test 
        FOREIGN KEY (lab_test_id) 
        REFERENCES lab_tests(id) 
        ON DELETE SET NULL
    `);

    // Add index for faster payment lookups
    await queryRunner.query(`
      CREATE INDEX idx_lab_test_orders_payment_id 
      ON lab_test_orders(payment_id)
    `);

    // Add index for lab_test_id
    await queryRunner.query(`
      CREATE INDEX idx_lab_test_orders_lab_test_id 
      ON lab_test_orders(lab_test_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_lab_test_orders_lab_test_id
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_lab_test_orders_payment_id
    `);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE lab_test_orders 
      DROP CONSTRAINT IF EXISTS fk_lab_test_order_lab_test
    `);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE lab_test_orders 
      DROP COLUMN IF EXISTS lab_test_id
    `);

    await queryRunner.query(`
      ALTER TABLE lab_test_orders 
      DROP COLUMN IF EXISTS payment_id
    `);
  }
}
