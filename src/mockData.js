// ========================= USERS =========================
export const mockUsers = [];

// ========================= PROJECTS =========================
export const mockProjects = [];

// ========================= PROJECT MEMBERS =========================
export const mockProjectMembers = [];

// ========================= DATASETS =========================
export const mockDatasets = [];

// ========================= DATA ITEMS =========================
export const mockDataItems = [];

// ========================= DATASET ASSIGNMENTS =========================
export const mockDatasetAssignments = [];

// ========================= DATA ITEM ASSIGNMENTS =========================
export const mockDataItemAssignments = [];

// ========================= LABELS =========================
export const mockLabels = [];

// ========================= LABEL GUIDELINES =========================
export const mockLabelGuidelines = [];

// ========================= ANNOTATIONS =========================
export const mockAnnotations = [];

// ========================= REVIEWS =========================
export const mockReviews = [];

// ========================= FINAL RESULTS =========================
export const mockFinalResults = [];

// ========================= EXPORT JOBS =========================
export const mockExportJobs = [];

// ========================= AUTH FUNCTIONS =========================
export const mockLogin = (email, password) => {
  const user = mockUsers.find(u => u.email === email && u.password === password);
  if (user) {
    return { success: true, user: { id: user.id, username: user.username, email: user.email, role: user.role } };
  }
  return { success: false, message: 'Email hoặc mật khẩu không đúng' };
};

export const mockRegister = (email, password, username) => {
  const exists = mockUsers.find(u => u.email === email);
  if (exists) {
    return { success: false, message: 'Email đã tồn tại' };
  }
  const newUser = { id: mockUsers.length + 1, username, email, password, role: 'annotator', status: 'active', created_at: new Date().toISOString() };
  mockUsers.push(newUser);
  return { success: true, user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role } };
};

// ========================= HELPER FUNCTIONS =========================
export const getUserById = (id) => mockUsers.find(u => u.id === id) || null;
export const getProjectById = (id) => mockProjects.find(p => p.id === id) || null;
export const getDatasetById = (id) => mockDatasets.find(d => d.id === id) || null;
export const getLabelById = (id) => mockLabels.find(l => l.id === id) || null;
export const getAnnotationById = (id) => mockAnnotations.find(a => a.id === id) || null;
