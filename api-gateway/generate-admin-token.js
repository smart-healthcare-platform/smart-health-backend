const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Get JWT secret from environment or use default
const JWT_SECRET = process.env.JWT_SECRET || 'smartHealthSecretKeyForJWTTokenGenerationAndValidation2024';

// Admin user payload
const adminPayload = {
  id: 'admin-test-001',
  sub: 'admin-test-001',
  email: 'admin@smarthealth.com',
  name: 'Admin Test User',
  fullName: 'Admin Test User',
  role: 'ADMIN',
  roles: ['ADMIN', 'USER'],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
};

// Generate token
const token = jwt.sign(adminPayload, JWT_SECRET);

console.log('\n========================================');
console.log('🎫 Admin JWT Token Generated');
console.log('========================================\n');

console.log('User Info:');
console.log(`  - ID: ${adminPayload.id}`);
console.log(`  - Email: ${adminPayload.email}`);
console.log(`  - Name: ${adminPayload.name}`);
console.log(`  - Role: ${adminPayload.role}`);
console.log(`  - Roles: ${adminPayload.roles.join(', ')}`);
console.log(`  - Expires: ${new Date(adminPayload.exp * 1000).toISOString()}`);

console.log('\n----------------------------------------\n');

console.log('JWT Token:');
console.log(token);

console.log('\n----------------------------------------\n');

console.log('Export to environment variable:');
console.log(`export ADMIN_TOKEN="${token}"`);

console.log('\n----------------------------------------\n');

console.log('Test commands:');
console.log('\n# Get admin info');
console.log(`curl -H "Authorization: Bearer ${token.substring(0, 20)}..." http://localhost:8080/v1/admin`);

console.log('\n# Get dashboard stats');
console.log(`curl -H "Authorization: Bearer ${token.substring(0, 20)}..." http://localhost:8080/v1/admin/dashboard/stats`);

console.log('\n# Get system health');
console.log(`curl -H "Authorization: Bearer ${token.substring(0, 20)}..." http://localhost:8080/v1/admin/system/health`);

console.log('\n========================================\n');

// Save to file for easy reuse
const fs = require('fs');
const tokenFile = path.join(__dirname, '.admin-token');

try {
  fs.writeFileSync(tokenFile, token);
  console.log(`✅ Token saved to: ${tokenFile}`);
  console.log(`\nYou can load it with:`);
  console.log(`export ADMIN_TOKEN=$(cat ${tokenFile})`);
  console.log('\n========================================\n');
} catch (error) {
  console.error('❌ Failed to save token to file:', error.message);
}

// Also create a .env.test file with the token
const envTestFile = path.join(__dirname, '.env.test');
try {
  const envContent = `# Admin Test Token
ADMIN_TOKEN="${token}"
`;
  fs.writeFileSync(envTestFile, envContent);
  console.log(`✅ Token also saved to: ${envTestFile}`);
  console.log('\n========================================\n');
} catch (error) {
  console.error('❌ Failed to save .env.test:', error.message);
}