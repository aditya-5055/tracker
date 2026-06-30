import api from './index';

export const fetchDayTasks      = (date)   => api.get(`/tasks?date=${date}`);
export const fetchMonthTasks    = (month)  => api.get(`/tasks?month=${month}`);
export const fetchYearTasks     = (year)   => api.get(`/tasks?year=${year}`);
export const fetchDashboardStats= ()       => api.get('/tasks/dashboard');
export const fetchTasksByRange  = (start, end) => api.get(`/tasks?startDate=${start}&endDate=${end}`);
export const createTask         = (data)   => api.post('/tasks', data);
export const updateTask         = (id, data) => api.patch(`/tasks/${id}`, data);
export const deleteTask         = (id)     => api.delete(`/tasks/${id}`);
