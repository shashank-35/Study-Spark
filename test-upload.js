// Simple test script to verify upload and chat functionality
// Run this after starting the server with: npm run api

const fs = require('fs');
const path = require('path');

// Test file creation
const testContent = `
BCA Study Notes - C Programming

1. What are pointers in C?
Pointers are variables that store memory addresses of other variables. They are fundamental to C programming and allow dynamic memory allocation.

2. Explain arrays in C.
Arrays are collections of elements of the same data type stored in contiguous memory locations. They provide efficient access to elements using indices.

3. What is the difference between malloc() and calloc()?
malloc() allocates memory without initializing it, while calloc() allocates memory and initializes all bytes to zero.

4. How do you declare a function pointer?
Function pointers are declared using the syntax: return_type (*pointer_name)(parameter_types);

5. What is recursion?
Recursion is a programming technique where a function calls itself to solve a problem by breaking it down into smaller subproblems.
`;

// Create test file
const testFilePath = path.join(__dirname, 'test-notes.txt');
fs.writeFileSync(testFilePath, testContent);
console.log('✅ Test file created:', testFilePath);

// Test upload
async function testUpload() {
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    form.append('subject', 'C Programming');
    form.append('scope', 'user');

    const response = await fetch('http://localhost:8787/api/upload', {
      method: 'POST',
      body: form
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Upload successful!');
      console.log('File ID:', data.id);
      console.log('Questions found:', data.questionSuggestions.length);
      return data.id;
    } else {
      console.log('❌ Upload failed:', response.status);
      const error = await response.text();
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('❌ Upload error:', error.message);
  }
}

// Test chat
async function testChat(fileId) {
  try {
    const response = await fetch('http://localhost:8787/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Explain pointers in C programming' }
        ],
        fileId: fileId
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Chat successful!');
      console.log('Response:', data.content.substring(0, 200) + '...');
    } else {
      console.log('❌ Chat failed:', response.status);
      const error = await response.text();
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('❌ Chat error:', error.message);
  }
}

// Test health check
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

// Run tests
async function runTests() {
  console.log('🚀 Starting tests...\n');
  
  // Test 1: Health check
  console.log('1. Testing server health...');
  const isHealthy = await testHealth();
  if (!isHealthy) {
    console.log('❌ Server is not running. Please start it with: npm run api\n');
    return;
  }
  console.log('');

  // Test 2: Upload
  console.log('2. Testing file upload...');
  const fileId = await testUpload();
  if (!fileId) {
    console.log('❌ Upload test failed\n');
    return;
  }
  console.log('');

  // Test 3: Chat
  console.log('3. Testing chat functionality...');
  await testChat(fileId);
  console.log('');

  // Cleanup
  fs.unlinkSync(testFilePath);
  console.log('🧹 Test file cleaned up');
  console.log('\n✨ All tests completed!');
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ for fetch support');
  console.log('Please upgrade Node.js or install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);
