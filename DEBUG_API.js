// Debug utility for testing API connection
// Add this to your browser console to test

// Test 1: Check if backend is reachable
async function testBackendConnection() {
  try {
    console.log('🔍 Testing backend connection...');
    const response = await fetch('https://localhost:7076/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test' })
    });
    console.log('✅ Backend is reachable!');
    console.log('Response status:', response.status);
    const data = await response.json().catch(() => ({ error: 'Could not parse JSON' }));
    console.log('Response data:', data);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    console.log('Possible issues:');
    console.log('1. Backend is not running on https://localhost:7076');
    console.log('2. CORS is not configured on backend');
    console.log('3. SSL certificate issue (might need to accept cert)');
    return false;
  }
}

// Test 2: Check localStorage
function testLocalStorage() {
  console.log('🔍 Testing localStorage...');
  try {
    localStorage.setItem('test', 'value');
    const val = localStorage.getItem('test');
    localStorage.removeItem('test');
    console.log('✅ localStorage is working');
    console.log('Current stored data:');
    console.log('  token:', localStorage.getItem('token') ? '✓ Set' : '✗ Not set');
    console.log('  refreshToken:', localStorage.getItem('refreshToken') ? '✓ Set' : '✗ Not set');
    return true;
  } catch (error) {
    console.error('❌ localStorage error:', error);
    return false;
  }
}

// Test 3: Check API base URL
function testAPIConfig() {
  console.log('🔍 API Configuration:');
  console.log('  Base URL: https://localhost:7076/api');
  console.log('  Auth endpoint: https://localhost:7076/api/auth/login');
}

// Test 4: Log test credentials
function showTestCredentials() {
  console.log('🔑 Test Credentials (from mockData):');
  console.log('  Admin: admin@gmail.com / 123456');
  console.log('  Manager: manager@gmail.com / 123456');
  console.log('  Annotator: annotator@gmail.com / 123456');
  console.log('  Reviewer: reviewer@gmail.com / 123456');
}

// Run all tests
console.log('=== API Debug Suite ===');
testAPIConfig();
showTestCredentials();
testLocalStorage();
testBackendConnection().then(success => {
  if (success) {
    console.log('\n✅ All systems operational!');
  } else {
    console.log('\n❌ Connection issue detected. Check items above.');
  }
});
