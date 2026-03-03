// Test script to verify Gemini API integration
// Run this after starting the server with: npm run api

console.log('🧪 Testing Gemini API Integration...\n');

// Test 1: Health check
async function testHealth() {
  try {
    const response = await fetch('http://localhost:8787/api/health');
    if (response.ok) {
      console.log('✅ Server is running and healthy');
      return true;
    } else {
      console.log('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    return false;
  }
}

// Test 2: Test Gemini API directly
async function testGeminiAPI() {
  try {
    console.log('🔍 Testing Gemini API endpoint...');
    const response = await fetch('http://localhost:8787/api/test-gemini');
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log('✅ Gemini API test successful!');
        console.log('Response:', data.response.substring(0, 100) + '...');
        return true;
      } else {
        console.log('❌ Gemini API test failed:', data.message);
        return false;
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Gemini API test failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Gemini API test error:', error.message);
    return false;
  }
}

// Test 3: Test chat endpoint
async function testChat() {
  try {
    console.log('💬 Testing chat endpoint...');
    const response = await fetch('http://localhost:8787/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello, what is C programming?' }
        ]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Chat test successful!');
      console.log('Response:', data.content.substring(0, 100) + '...');
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Chat test failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Chat test error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Gemini API tests...\n');
  
  // Test 1: Health check
  console.log('1. Testing server health...');
  const isHealthy = await testHealth();
  if (!isHealthy) {
    console.log('❌ Server is not running. Please start it with: npm run api\n');
    return;
  }
  console.log('');

  // Test 2: Gemini API test
  console.log('2. Testing Gemini API...');
  const geminiWorking = await testGeminiAPI();
  if (!geminiWorking) {
    console.log('❌ Gemini API is not working properly\n');
    return;
  }
  console.log('');

  // Test 3: Chat endpoint
  console.log('3. Testing chat functionality...');
  const chatWorking = await testChat();
  if (!chatWorking) {
    console.log('❌ Chat endpoint is not working properly\n');
    return;
  }
  console.log('');

  console.log('✨ All tests completed successfully!');
  console.log('🎉 Your chatbot should now be working with Gemini API!');
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ for fetch support');
  console.log('Please upgrade Node.js or install node-fetch');
  process.exit(1);
}

runAllTests().catch(console.error);
