import api from './client.js';

const unwrap = (response) => response.data?.data ?? response.data;
export const authApi = {
  forgotPassword: (email) => api.post('/auth/student/forgot-password', { email }),
};
export const profileApi = {
  get: async () => unwrap(await api.get('/students/me/profile')),
  update: async (payload) => unwrap(await api.put('/students/me/profile', payload)),
  getSkills: async () => unwrap(await api.get('/students/me/skills')),
  updateSkills: async (skills) => unwrap(await api.put('/students/me/skills', { skills })),
  uploadResume: async (file) => {
    const form = new FormData(); form.append('resume', file);
    return unwrap(await api.post('/students/me/resume', form, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },
  deleteResume: async () => unwrap(await api.delete('/students/me/resume')),
};
export const driveApi = {
  list: async (params) => unwrap(await api.get('/drives', { params })),
  get: async (id) => unwrap(await api.get(`/drives/${id}`)),
  eligibility: async (id) => unwrap(await api.get(`/drives/${id}/eligibility`)),
  apply: async (id) => unwrap(await api.post(`/drives/${id}/apply`)),
};
export const trainingApi = {
  list: async (params) => unwrap(await api.get('/trainings', { params })),
  get: async (id) => unwrap(await api.get(`/trainings/${id}`)),
  enroll: async (id) => unwrap(await api.post(`/trainings/${id}/enroll`)),
  mine: async () => unwrap(await api.get('/trainings/student')),
};
export const applicationApi = { mine: async () => unwrap(await api.get('/applications/student')) };
export const interviewApi = { mine: async () => unwrap(await api.get('/interviews/student')) };
export const notificationApi = {
  mine: async () => unwrap(await api.get('/notifications/me')),
  markRead: async (id) => unwrap(await api.patch(`/notifications/${id}/read`)),
};

export const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};
