# API Migration Guide - Remaining Components

## Summary of Completed Updates

✅ **core/api.js** - All 50+ API endpoints created with proper auth headers
✅ **Login.jsx** - Now calls POST /api/auth/login with token storage
✅ **Admin/SystemOverview.jsx** - Fetches users and activity logs
✅ **Manager/ProjectManagement.jsx** - Fetches projects, create/update/delete
✅ **Annotator/TaskList.jsx** - Fetches assigned tasks  
✅ **Reviewer/PendingReviews.jsx** - Fetches submitted queue for review

## Pattern for Remaining Components

Follow this pattern for updating each component:

### 1. Replace imports

```javascript
// OLD:
import { mockData... } from '../../mockData';

// NEW:
import { useState, useEffect } from 'react';
import { useAPI, getDataAPI, createDataAPI, updateDataAPI } from '../../api';
```

### 2. Add state management

```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [saving, setSaving] = useState(false);
```

### 3. Add useEffect for initial fetch

```javascript
useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");

    const response = await getDataAPI(token);
    setData(response.data || response);
    setError("");
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### 4. Update CRUD operations

```javascript
// Create
const handleCreate = async (formData) => {
  try {
    setSaving(true);
    const token = localStorage.getItem("token");
    const response = await createDataAPI(formData, token);
    setData([...data, response.data || response]);
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    setSaving(false);
  }
};

// Update
const handleUpdate = async (id, formData) => {
  try {
    setSaving(true);
    const token = localStorage.getItem("token");
    await updateDataAPI(id, formData, token);
    setData(
      data.map((item) => (item.id === id ? { ...item, ...formData } : item)),
    );
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    setSaving(false);
  }
};

// Delete
const handleDelete = async (id) => {
  try {
    const token = localStorage.getItem("token");
    await deleteDataAPI(id, token);
    setData(data.filter((item) => item.id !== id));
  } catch (err) {
    alert("Error: " + err.message);
  }
};
```

### 5. Add loading/error handling in JSX

```javascript
if (loading) return <div className="loading">Đang tải...</div>;
if (error) return <div className="error-message">{error}</div>;
```

## Remaining Components to Update

### Manager Components (5 remaining):

- [ ] **DatasetManagement.jsx** - Use: getDatasetsByProjectAPI, createDatasetAPI, updateDatasetAPI
- [ ] **LabelManagement.jsx** - Use: getLabelsByProjectAPI, createLabelAPI, updateLabelAPI, deleteLabelAPI
- [ ] **TaskAssignment.jsx** - Use: assignDatasetAPI, getDataItemsAPI
- [ ] **QualityOverview.jsx** - Use: getQualityOverviewAPI
- [ ] **ExportData.jsx** - Use: getExportJobsAPI, exportProjectAPI

### Annotator Components (3 remaining):

- [ ] **AnnotationWorkspace.jsx** - Use: getTaskDetailAPI, createAnnotationAPI, submitForReviewAPI
- [ ] **MyAnnotations.jsx** - Use: getAssignedTasksAPI, getAnnotationFeedbackAPI
- [ ] **AnnotatorLayout.jsx** - Update nav/routing if needed

### Reviewer Components (2 remaining):

- [ ] **ReviewWorkspace.jsx** - Use: getReviewDetailAPI, submitDecisionAPI
- [ ] **ReviewHistory.jsx** - Use: getSubmittedQueueAPI (already integrated in PendingReviews)

### Admin Components (1 remaining):

- [ ] **ProjectsOverview.jsx** - Use: getProjectsAPI, getUsersAPI (fetch all necessary data)
- [ ] **UserManagement.jsx** - Use: getUsersAPI, createUserAPI, updateUserAPI, deleteUserAPI

## Key API Endpoints by Component

### Manager

```javascript
getProjectsAPI(token);
getProjectByIdAPI(projectId, token);
createProjectAPI(data, token);
updateProjectAPI(projectId, data, token);

getDatasetsByProjectAPI(projectId, token);
createDatasetAPI(projectId, data, token);
updateDatasetAPI(datasetId, data, token);

getDataItemsAPI(datasetId, token);
createDataItemAPI(datasetId, data, token);

getLabelsByProjectAPI(projectId, token);
createLabelAPI(projectId, data, token);
updateLabelAPI(labelId, data, token);
deleteLabelAPI(labelId, token);

assignDatasetAPI(datasetId, data, token);
getDatasetProgressAPI(datasetId, token);
getQualityOverviewAPI(projectId, token);

exportProjectAPI(projectId, data, token);
getExportJobsAPI(projectId, token);
```

### Annotator

```javascript
getAssignedTasksAPI(token);
getTaskDetailAPI(dataItemAssignmentId, token);
createAnnotationAPI(data, token);
submitForReviewAPI(annotationIds, token);
getAnnotationFeedbackAPI(annotationId, token);
```

### Reviewer

```javascript
getSubmittedQueueAPI(token);
getReviewDetailAPI(annotationId, token);
submitDecisionAPI(data, token);
```

### Admin

```javascript
getUsersAPI(token);
getUserByIdAPI(id, token);
createUserAPI(data, token);
updateUserAPI(id, data, token);
deleteUserAPI(id, token);
getActivityLogsAPI(token);
```

## Response Format Expectations

The API should return one of these formats:

```javascript
// Format 1: Direct array
[{id: 1, name: '...'}, ...]

// Format 2: Wrapped in data property
{data: [{id: 1, name: '...'}, ...]}

// Format 3: Full response object
{success: true, data: [...], message: '...'}
```

Note: API functions handle all three formats automatically with:

```javascript
const data = response.data || response;
```

## Expected Response Field Names

Based on the API endpoints, expect these field names:

- Users: id, username, email, role, status, created_at
- Projects: id, name, description, status, created_at
- Datasets: id, project_id, name, description, status, created_at
- Data Items: id, dataset_id, content, status
- Labels: id, project_id, name, parent_id
- Annotations: id, data_item_id, user_id, label_value, status, created_at
- Reviews: id, annotation_id, reviewer_id, status, comment, reviewed_at

## Testing the API

1. Make sure your backend is running on localhost:7076
2. Test with valid credentials:
   - Email: admin@gmail.com / manager@gmail.com / annotator@gmail.com / reviewer@gmail.com
   - Password: 123456 (default, change based on your backend)

3. The token from login will be automatically stored in localStorage and used for authenticated requests

## Common Issues & Solutions

**Issue: 401 Unauthorized**

- Token may have expired, refresh needed
- Check if token is being passed in Authorization header

**Issue: 404 Not Found**

- Check if backend endpoints match exactly
- Common: /api/manager/projects not /api/projects

**Issue: CORS errors**

- Backend may need CORS headers configured
- Add to backend: `Access-Control-Allow-Origin: *`

**Issue: Response format unexpected**

- Add console.log(response) to see actual format
- Update the data extraction: `response.data || response.items || response`

## Next Steps

1. Review the completed components to understand the pattern
2. Open each remaining component file
3. Apply the pattern step-by-step
4. Test each component after updating
5. Once all components use API, you can delete mockData.js

Good luck! The pattern is consistent across all components.
