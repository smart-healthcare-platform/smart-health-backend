/**
 * Debug script to check lab test orders and their payment status
 * 
 * Usage:
 * 1. Build: npm run build
 * 2. Run: node dist/scripts/check-lab-test-payments.js
 * 
 * This script will:
 * - Find all lab test orders
 * - Check if they have payments created
 * - Show which ones are missing payments
 * - Optionally create missing payments (with --fix flag)
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { LabTestOrder } from '../module/lab-tests/lab-test-order.entity';
import { LabTest } from '../module/lab-tests/lab-test.entity';
import { BillingClient } from '../common/clients/billing.client';

async function bootstrap() {
  console.log('🔍 Starting Lab Test Payment Check Script...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const billingClient = app.get(BillingClient);

  const labTestOrderRepo = dataSource.getRepository(LabTestOrder);
  const labTestRepo = dataSource.getRepository(LabTest);

  try {
    // 1. Get all lab test orders
    const allOrders = await labTestOrderRepo.find({
      relations: ['appointment'],
      order: { createdAt: 'DESC' },
    });

    console.log(`📊 Total lab test orders: ${allOrders.length}\n`);

    if (allOrders.length === 0) {
      console.log('✅ No lab test orders found in database.');
      await app.close();
      return;
    }

    // 2. Categorize orders
    const withPayment: LabTestOrder[] = [];
    const withoutPayment: LabTestOrder[] = [];

    for (const order of allOrders) {
      if (order.paymentId) {
        withPayment.push(order);
      } else {
        withoutPayment.push(order);
      }
    }

    console.log('📈 Payment Status Summary:');
    console.log(`  ✅ Orders WITH payment: ${withPayment.length}`);
    console.log(`  ❌ Orders WITHOUT payment: ${withoutPayment.length}\n`);

    // 3. Show orders without payment
    if (withoutPayment.length > 0) {
      console.log('❌ Lab Test Orders WITHOUT Payment:\n');
      console.log('═'.repeat(80));

      for (const order of withoutPayment) {
        console.log(`\n📋 Order ID: ${order.id}`);
        console.log(`   Appointment ID: ${order.appointmentId || 'N/A'}`);
        console.log(`   Type: ${order.type}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Lab Test ID: ${order.labTestId || 'NOT SET'}`);
        console.log(`   Created: ${order.createdAt}`);

        // Try to find lab test info
        if (order.labTestId) {
          try {
            const labTest = await labTestRepo.findOne({
              where: { id: order.labTestId },
            });

            if (labTest) {
              console.log(`   💰 Lab Test: ${labTest.name}`);
              console.log(`   💰 Price: ${labTest.price}đ`);

              // Check if payment should exist
              if (labTest.price > 0) {
                console.log(`   🔴 MISSING PAYMENT! (Price > 0)`);
              } else {
                console.log(`   ⚪ No payment needed (Price = 0)`);
              }
            } else {
              console.log(`   ⚠️  Lab test not found in database`);
            }
          } catch (error) {
            console.log(`   ❌ Error fetching lab test: ${error.message}`);
          }
        } else {
          console.log(`   ⚠️  No labTestId - cannot determine price`);
        }

        console.log('─'.repeat(80));
      }

      // 4. Check if --fix flag is passed
      const shouldFix = process.argv.includes('--fix');

      if (shouldFix) {
        console.log('\n🔧 --fix flag detected. Creating missing payments...\n');

        let fixedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const order of withoutPayment) {
          if (!order.labTestId) {
            console.log(`⏭️  Skipping ${order.id} - no labTestId`);
            skippedCount++;
            continue;
          }

          try {
            const labTest = await labTestRepo.findOne({
              where: { id: order.labTestId },
            });

            if (!labTest || labTest.price <= 0) {
              console.log(`⏭️  Skipping ${order.id} - no price or price = 0`);
              skippedCount++;
              continue;
            }

            console.log(`\n💳 Creating payment for order ${order.id}...`);
            console.log(`   Lab Test: ${labTest.name} - ${labTest.price}đ`);

            const payment = await billingClient.createPayment({
              paymentType: 'LAB_TEST',
              referenceId: order.id,
              amount: labTest.price,
              paymentMethod: 'CASH',
            });

            console.log(`   ✅ Payment created: ${payment.paymentCode}`);

            // Update order with paymentId
            order.paymentId = payment.paymentCode;
            await labTestOrderRepo.save(order);

            console.log(`   ✅ Order updated with payment ID`);
            fixedCount++;
          } catch (error) {
            console.error(`   ❌ Error creating payment for ${order.id}:`, error.message);
            if (error.response) {
              console.error(`   Response:`, error.response.data);
            }
            errorCount++;
          }
        }

        console.log('\n' + '═'.repeat(80));
        console.log('\n📊 Fix Summary:');
        console.log(`   ✅ Successfully created: ${fixedCount}`);
        console.log(`   ⏭️  Skipped: ${skippedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
      } else {
        console.log('\n💡 To automatically create missing payments, run:');
        console.log('   node dist/scripts/check-lab-test-payments.js --fix\n');
      }
    } else {
      console.log('✅ All lab test orders have payments!\n');
    }

    // 5. Show sample of orders WITH payment (first 5)
    if (withPayment.length > 0) {
      console.log('\n✅ Sample of Lab Test Orders WITH Payment (first 5):\n');
      console.log('═'.repeat(80));

      const sample = withPayment.slice(0, 5);
      for (const order of sample) {
        console.log(`\n📋 Order ID: ${order.id}`);
        console.log(`   Appointment ID: ${order.appointmentId || 'N/A'}`);
        console.log(`   Type: ${order.type}`);
        console.log(`   💳 Payment ID: ${order.paymentId}`);
        console.log(`   Created: ${order.createdAt}`);
      }

      if (withPayment.length > 5) {
        console.log(`\n   ... and ${withPayment.length - 5} more`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✅ Script completed successfully!\n');
  } catch (error) {
    console.error('❌ Script failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});