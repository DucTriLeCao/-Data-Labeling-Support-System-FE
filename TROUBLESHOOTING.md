# Login Failed to Fetch - Troubleshooting Guide

## ✅ Changes Made

Fixed the API base URL from `http://localhost:7076/api` to `https://localhost:7076/api` to match your Swagger documentation.

## 🔍 How to Debug

### Step 1: Check Backend is Running

```bash
# Test if backend is accessible
curl https://localhost:7076/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@gmail.com","password":"123456"}'
```

### Step 2: Check Browser Console

1. Open DevTools (F12)
2. Go to **Console** tab
3. You should see debug info including:
   - API endpoint being used
   - Request/response details
   - Any error messages

### Step 3: Run Debug Utility

Copy this to your browser console:

```javascript
// Test backend connection
async function testBackendConnection() {
  try {
    console.log("Testing...");
    const response = await fetch("https://localhost:7076/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gmail.com", password: "123456" }),
    });
    console.log("Status:", response.status);
    console.log("Data:", await response.json());
  } catch (error) {
    console.error("Error:", error.message);
  }
}
testBackendConnection();
```

### Step 4: Check Network Tab

1. Go to DevTools → Network tab
2. Try to login
3. Look for the POST request to `/api/auth/login`
4. Check the response - what error do you get?

## 🚨 Common Issues & Solutions

### Issue: "CORS error" or "Failed to fetch"

**Cause**: Backend CORS not configured
**Solution**: Backend needs to allow requests from your frontend. Add to backend:

```javascript
// Example Node.js/Express CORS setup
app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend URL
    credentials: true,
  }),
);
```

### Issue: "SSL certificate error"

**Cause**: Self-signed certificate not trusted
**Solution**:

- In Chrome, go to https://localhost:7076 and accept the certificate warning
- Or configure backend to use proper SSL certificate

### Issue: "Cannot reach server"

**Cause**: Backend not running or wrong port
**Solution**:

1. Check if backend is running: `GET https://localhost:7076/`
2. Verify it's on port 7076 (not another port)
3. Check firewall settings

### Issue: "Login accepted but no redirect"

**Cause**: Response format doesn't match or user object missing
**Solution**: Backend should return:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "manager"
  }
}
```

## 🔧 Verify Setup

### Frontend Side (Already Done)

✅ API base URL: Set to `https://localhost:7076/api`
✅ All endpoints match Swagger
✅ Error logging added to Login component
✅ Debug info shown on login page

### Backend Side (You need to check)

- [ ] Backend running on port 7076
- [ ] Using HTTPS (not HTTP)
- [ ] CORS configured
- [ ] Auth endpoint at `/api/auth/login`
- [ ] Returns proper response format
- [ ] Credentials working (check with curl/Postman first)

## 📋 API Endpoints Verified

All endpoints match your Swagger documentation:

**Auth**: ✅ All 5 endpoints correct
**Annotator**: ✅ All 5 endpoints correct  
**Reviewer**: ✅ All 3 endpoints correct
**Admin**: ✅ All 6 endpoints correct
**Manager**: ✅ All 19 endpoints correct

## 🧪 Test with Curl

Before trying frontend, test backend directly:

```bash
# Test login
curl -k https://localhost:7076/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"123456"}'

# Expected response:
# {
#   "access_token": "eyJhbGc...",
#   "refresh_token": "...",
#   "user": {"id": 1, "email": "admin@gmail.com", "role": "admin"}
# }
```

## 📝 Next Steps

1. **Verify backend is running** on https://localhost:7076
2. **Test with curl/Postman** to confirm backend works
3. **Check backend CORS** config
4. **Run debug utility** in browser console to see exact error
5. **Check Network tab** in DevTools to see response details

## 💡 Pro Tips

- **Test credentials** (if using mock data):
  - admin@gmail.com / 123456
  - manager@gmail.com / 123456
  - annotator@gmail.com / 123456
  - reviewer@gmail.com / 123456

- **Use Swagger** to test endpoints: https://localhost:7076/swagger/

- **Check backend logs** for detailed error messages

- **Use Postman** to test API before integrating with frontend

## 🆘 If Still Not Working

1. Open browser console (F12)
2. Try login and capture the exact error message
3. Check what the API returns in the Network tab
4. Verify backend is actually responding (test with curl first)
5. Check if backend CORS is configured correctly

---

**Last Updated**: 2026-03-21
**All API endpoints verified against Swagger documentation**
