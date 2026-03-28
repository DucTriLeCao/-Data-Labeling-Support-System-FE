const API_BASE_URL = 'https://localhost:7076/api';

// Handle fetch errors including network failures
const handleFetchError = async (response, endpoint) => {
  let errorMessage = `Request to ${endpoint} failed`;
  
  try {
    const data = await response.json();
    errorMessage = data.message || data.error || errorMessage;
  } catch {
    errorMessage = response.statusText || errorMessage;
  }
  
  throw new Error(errorMessage);
};

// ==================== AUTH ENDPOINTS ====================

export const loginAPI = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      await handleFetchError(response, '/auth/login');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const refreshTokenAPI = async (refreshToken) => {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Token refresh failed');
  return data;
};

export const forgotPasswordAPI = async (emailOrUsername) => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Forgot password request failed');
  return data;
};

export const resetPasswordAPI = async (userId, resetToken, newPassword, confirmPassword) => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: parseInt(userId), resetToken, newPassword, confirmPassword })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Reset password failed');
  return data;
};

export const changePasswordAPI = async (currentPassword, newPassword, token) => {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Change password failed');
  return data;
};

// ==================== ANNOTATOR ENDPOINTS ====================

export const getAssignedTasksAPI = async (token, pageNumber = 1, pageSize = 20) => {
  const response = await fetch(`${API_BASE_URL}/annotator/assigned-tasks?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch assigned tasks');
  return data;
};

export const getTaskDetailAPI = async (dataItemAssignmentId, token) => {
  const response = await fetch(`${API_BASE_URL}/annotator/task-detail/${dataItemAssignmentId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch task detail');
  return data;
};

export const createAnnotationAPI = async (annotationData, token) => {
  const response = await fetch(`${API_BASE_URL}/annotator/create-annotation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(annotationData)
  });
  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.message || data.error || 'Failed to create annotation';
    throw new Error(errorMsg);
  }
  return data;
};

export const submitForReviewAPI = async (annotationId, token) => {
  const payload = { annotationId: annotationId };
  
  const response = await fetch(`${API_BASE_URL}/annotator/submit-for-review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to submit for review');
  return data;
};

export const getAnnotationFeedbackAPI = async (annotationId, token) => {
  const response = await fetch(`${API_BASE_URL}/annotator/annotation-feedback/${annotationId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch annotation feedback');
  return data;
};

export const getAnnotatorHistoryAPI = async (token, pageNumber = 1, pageSize = 20, status = null) => {
  let url = `${API_BASE_URL}/annotator/annotation-history?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  if (status) {
    url += `&status=${status}`;
  }
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch annotation history');
  return data;
};

// ==================== REVIEWER ENDPOINTS ====================

export const getSubmittedQueueAPI = async (token, pageNumber = 1, pageSize = 20) => {
  const response = await fetch(`${API_BASE_URL}/reviewer/submitted-queue?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch submitted queue');
  return data;
};

export const getReviewDetailAPI = async (annotationId, token) => {
  const response = await fetch(`${API_BASE_URL}/reviewer/review-detail/${annotationId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch review detail');
  return data;
};

export const submitDecisionAPI = async (decisionData, token) => {
  const response = await fetch(`${API_BASE_URL}/reviewer/submit-decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(decisionData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to submit decision');
  return data;
};

export const getReviewerHistoryAPI = async (token, pageNumber = 1, pageSize = 20, status = null) => {
  let url = `${API_BASE_URL}/reviewer/review-history?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  if (status) {
    url += `&status=${status}`;
  }
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch review history');
  return data;
};

// ==================== ADMIN ENDPOINTS ====================

export const getUsersAPI = async (token, pageNumber = 1, pageSize = 20) => {
  const response = await fetch(`${API_BASE_URL}/admin/users?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch users');
  return data;
};

export const getManagerUsersAPI = async (token) => {
  const response = await fetch(`${API_BASE_URL}/manager/users`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch users');
  return data;
};

export const getUserByIdAPI = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch user');
  return data;
};

export const createUserAPI = async (userData, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create user');
  return data;
};

export const updateUserAPI = async (id, userData, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update user');
  return data;
};

export const deleteUserAPI = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete user');
  }
  
  // DELETE endpoint returns empty response (soft delete sets status to Inactive)
  try {
    const data = await response.json();
    return data;
  } catch (e) {
    // Empty response is OK for soft delete
    return { success: true };
  }
};

export const bulkDeactivateUsersAPI = async (userIds, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/bulk-deactivate`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userIds)
  });
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to deactivate users');
  }
  
  try {
    const data = await response.json();
    return data;
  } catch (e) {
    return { success: true };
  }
};

export const getActivityLogsAPI = async (token, pageNumber = 1, pageSize = 20) => {
  const response = await fetch(`${API_BASE_URL}/admin/activity-logs?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch activity logs');
  return data;
};

// ==================== MANAGER ENDPOINTS ====================

// Projects
export const getProjectsAPI = async (token, pageNumber = 1, pageSize = 20, searchTerm = '', status = '') => {
  let url = `${API_BASE_URL}/manager/projects?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  if (searchTerm) url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
  if (status) url += `&status=${status}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch projects');
  return data;
};

export const getProjectByIdAPI = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/projects/${id}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch project');
  return data;
};

export const createProjectAPI = async (projectData, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(projectData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create project');
  return data;
};

export const updateProjectAPI = async (id, projectData, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/projects/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(projectData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update project');
  return data;
};

// Datasets
export const getDatasetsByProjectAPI = async (projectId, token, pageNumber = 1, pageSize = 20, searchTerm = '', status = '') => {
  let url = `${API_BASE_URL}/manager/datasets?projectId=${projectId}&pageNumber=${pageNumber}&pageSize=${pageSize}`;
  if (searchTerm) url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
  if (status) url += `&status=${status}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch datasets');
  return data;
};

export const createDatasetAPI = async (projectId, datasetData, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/projects/${projectId}/datasets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(datasetData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create dataset');
  return data;
};

export const getDatasetByIdAPI = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/datasets/${id}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch dataset');
  return data;
};

export const updateDatasetAPI = async (id, datasetData, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/datasets/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(datasetData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update dataset');
  return data;
};

// Data Items
export const getDataItemsAPI = async (datasetId, token, pageNumber = 1, pageSize = 20, searchTerm = '', status = '') => {
  let url = `${API_BASE_URL}/manager/data-items?datasetId=${datasetId}&pageNumber=${pageNumber}&pageSize=${pageSize}`;
  if (searchTerm) url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
  if (status) url += `&status=${status}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch data items');
  return data;
};

export const createDataItemAPI = async (datasetId, itemData, token) => {
  // itemData should be FormData for file uploads
  const isFormData = itemData instanceof FormData;
  
  const response = await fetch(`${API_BASE_URL}/manager/datasets/${datasetId}/items`, {
    method: 'POST',
    headers: isFormData ? {
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData - let browser set it with boundary
    } : {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: isFormData ? itemData : JSON.stringify(itemData)
  });
  
  if (!response.ok) {
    let errorMessage = 'Failed to create data item';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data;
};

export const getDataItemByIdAPI = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/data-items/${id}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch data item');
  return data;
};

// Labels
export const getLabelsByProjectAPI = async (projectId, token, pageNumber = 1, pageSize = 20) => {
  const url = `${API_BASE_URL}/manager/projects/${projectId}/labels?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch labels');
  return data;
};

export const createLabelAPI = async (projectId, labelData, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/projects/${projectId}/labels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(labelData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create label');
  return data;
};

export const getLabelByIdAPI = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/labels/${id}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch label');
  return data;
};

export const updateLabelAPI = async (id, labelData, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/labels/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(labelData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update label');
  return data;
};

// Task Assignment
export const assignDatasetAPI = async (datasetId, assignmentData, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/datasets/${datasetId}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(assignmentData)
  });
  
  const text = await response.text();
  
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    if (!response.ok) {
      throw new Error(text || 'Failed to assign dataset');
    }
    data = { message: text };
  }
  
  if (!response.ok) throw new Error(data.message || text || 'Failed to assign dataset');
  return data;
};

export const getDatasetAssignmentsAPI = async (datasetId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/manager/datasets/${datasetId}/assignments`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch assignments');
    return data;
  } catch (err) {
    // Fallback: return empty if endpoint doesn't exist
    return { items: [] };
  }
};

// Dataset Progress
export const getDatasetProgressAPI = async (datasetId, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/datasets/${datasetId}/progress`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch dataset progress');
  return data;
};

// Quality Overview
export const getQualityOverviewAPI = async (projectId, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/projects/${projectId}/quality-overview`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch quality overview');
  return data;
};

// Export
export const exportProjectAPI = async (projectId, exportData, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/projects/${projectId}/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(exportData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to export project');
  return data;
};

export const getExportJobsAPI = async (projectId, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/projects/${projectId}/export-jobs`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch export jobs');
  return data;
};

// ==================== DELETE ENDPOINTS ====================

// Projects - Single Delete
export const deleteProjectAPI = async (projectId, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/projects/${projectId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (response.status === 204) return { success: true, message: 'Project deleted successfully' };
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Failed to delete project');
  return data;
};

// Projects - Bulk Delete
export const bulkDeleteProjectsAPI = async (projectIds, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/projects/bulk`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(projectIds)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to bulk delete projects');
  return data;
};

// Datasets - Single Delete
export const deleteDatasetAPI = async (datasetId, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/datasets/${datasetId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (response.status === 204) return { success: true, message: 'Dataset deleted successfully' };
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Failed to delete dataset');
  return data;
};

// Datasets - Bulk Delete
export const bulkDeleteDatasetsAPI = async (datasetIds, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/datasets/bulk`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(datasetIds)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to bulk delete datasets');
  return data;
};

// Data Items - Single Delete
export const deleteDataItemAPI = async (dataItemId, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/data-items/${dataItemId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (response.status === 204) return { success: true, message: 'Data item deleted successfully' };
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Failed to delete data item');
  return data;
};

// Data Items - Bulk Delete
export const bulkDeleteDataItemsAPI = async (dataItemIds, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/data-items/bulk`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(dataItemIds)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to bulk delete data items');
  return data;
};

// Labels - Single Delete
export const deleteLabelAPI = async (labelId, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/labels/${labelId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (response.status === 204) return { success: true, message: 'Label deleted successfully' };
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Failed to delete label');
  return data;
};

// Labels - Bulk Delete
export const bulkDeleteLabelsAPI = async (labelIds, token) => {
  const response = await fetch(`${API_BASE_URL}/manager/labels/bulk`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(labelIds)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to bulk delete labels');
  return data;
};
