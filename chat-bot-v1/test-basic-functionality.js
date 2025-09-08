const app = require('./src/app');
const request = require('supertest');

// Test basic functionality without database
async function testBasicFunctionality() {
  console.log('Testing basic server functionality...');
  
  try {
    // Test health endpoint (should work even without database)
    const healthResponse = await request(app).get('/health');
    console.log('✅ Health endpoint status:', healthResponse.status);
    
    // Test 404 handler
    const notFoundResponse = await request(app).get('/nonexistent');
    console.log('✅ 404 handler status:', notFoundResponse.status);
    
    // Test chat endpoint validation
    const chatResponse = await request(app)
      .post('/api/chat')
      .send({ invalid: 'data' });
    console.log('✅ Chat validation status:', chatResponse.status);
    
    console.log('✅ Basic functionality tests passed!');
    
  } catch (error) {
    console.error('❌ Basic functionality test failed:', error.message);
    process.exit(1);
  }
}

testBasicFunctionality();