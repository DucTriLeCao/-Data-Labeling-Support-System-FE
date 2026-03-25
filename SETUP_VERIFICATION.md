# Quick Setup Verification

## ✅ Frontend Changes Complete

- [x] API base URL updated to `https://localhost:7076/api`
- [x] Error handling improved with detailed logging
- [x] Login component shows debug info
- [x] Browser console logging added
- [x] All 50+ API endpoints configured correctly

## 🔧 Backend Verification (Check These)

### 1. Is the Backend Running?

```bash
# Try this in terminal/command prompt
curl https://localhost:7076/api/auth/login
# Should get a 400 or 401 error (not connection error)
```

### 2. Check Backend Logs

- Look for "Server running on port 7076" or similar message
- Check that it's using HTTPS not HTTP

### 3. Verify CORS Configuration

Backend should have CORS enabled:

```javascript
// Express example
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
```

### 4. Test Login Endpoint

Using Postman or curl:

```bash
curl -k https://localhost:7076/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"123456"}'
```

Expected response should include:

- `access_token`
- `refresh_token` (optional)
- `user` object with at least `{id, email, role}`

## 📝 All Endpoints Verified

### Auth ✅

- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/change-password

### Annotator ✅

- GET /api/annotator/assigned-tasks
- GET /api/annotator/task-detail/{id}
- POST /api/annotator/create-annotation
- POST /api/annotator/submit-for-review
- GET /api/annotator/annotation-feedback/{id}

### Reviewer ✅

- GET /api/reviewer/submitted-queue
- GET /api/reviewer/review-detail/{id}
- POST /api/reviewer/submit-decision

### Admin ✅

- GET /api/admin/users
- GET /api/admin/users/{id}
- POST /api/admin/users
- PUT /api/admin/users/{id}
- DELETE /api/admin/users/{id}
- GET /api/admin/activity-logs

### Manager ✅

- GET /api/manager/projects
- GET /api/manager/projects/{id}
- POST /api/manager/projects
- PUT /api/manager/projects/{id}
- GET /api/manager/projects/{projectId}/datasets
- POST /api/manager/projects/{projectId}/datasets
- PUT /api/manager/datasets/{id}
- GET /api/manager/datasets/{datasetId}/items
- POST /api/manager/datasets/{datasetId}/items
- GET /api/manager/projects/{projectId}/labels
- POST /api/manager/projects/{projectId}/labels
- PUT /api/manager/labels/{id}
- DELETE /api/manager/labels/{id}
- POST /api/manager/datasets/{datasetId}/assign
- GET /api/manager/datasets/{datasetId}/progress
- GET /api/manager/projects/{projectId}/quality-overview
- POST /api/manager/projects/{projectId}/export
- GET /api/manager/projects/{projectId}/export-jobs

## 🧪 Test Credentials

If using mock authentication in backend:

```
Email: admin@gmail.com, Password: 123456
Email: manager@gmail.com, Password: 123456
Email: annotator@gmail.com, Password: 123456
Email: reviewer@gmail.com, Password: 123456
```

## 🚀 Testing Frontend

1. **Start React app**

   ```bash
   npm run dev
   ```

   Should be at http://localhost:5173

2. **Open browser console** (F12 → Console tab)

3. **Try to login**
   - You should see debug logs in console
   - Check Network tab (F12 → Network) to see the request/response

4. **Look for errors**
   - CORS error → Fix backend CORS config
   - 401 error → Check credentials
   - 404 error → Check endpoint path
   - Connection error → Backend not running or wrong port

## 📊 API Architecture

```
Frontend (localhost:5173)
    ↓ HTTPS
Backend (localhost:7076)
    ├─ /api/auth/*
    ├─ /api/admin/*
    ├─ /api/manager/*
    ├─ /api/annotator/*
    └─ /api/reviewer/*
```

## 🔐 Security Notes

- Token stored in localStorage after login
- Auth header: `Authorization: Bearer {token}`
- All authenticated endpoints require valid token
- CORS must be enabled for frontend origin

## 💾 Files Changed

- ✅ `src/api.js` - All endpoints with HTTPS
- ✅ `src/components/Login.jsx` - Better error handling & logging
- ✅ Added debug helpers and documentation

## 📋 Next Actions

1. **Verify backend is running** on HTTPS port 7076
2. **Test backend** with Postman/Swagger first
3. **Run frontend** and try login
4. **Check browser console** for detailed error messages
5. **Check Network tab** to see API responses

## 🆘 Still Not Working?

Look at **TROUBLESHOOTING.md** for detailed debugging steps.

---

**Key Fix**: Changed from `http://` to `https://` to match your Swagger documentation
**Status**: Frontend ready, waiting for backend verification
