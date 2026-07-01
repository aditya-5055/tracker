import api from './index';

export const fetchNotes = async (params = {}) => {
  const { data } = await api.get('/notes', { params });
  return data;
};

export const fetchTags = async () => {
  const { data } = await api.get('/notes/tags');
  return data;
};

export const fetchNotesStats = async () => {
  const { data } = await api.get('/notes/stats');
  return data;
};

export const createNote = async (noteData = {}) => {
  const { data } = await api.post('/notes', noteData);
  return data;
};

export const getNote = async (id) => {
  const { data } = await api.get(`/notes/${id}`);
  return data;
};

export const updateNote = async (id, noteData) => {
  const { data } = await api.patch(`/notes/${id}`, noteData);
  return data;
};

export const deleteNote = async (id) => {
  const { data } = await api.delete(`/notes/${id}`);
  return data;
};

export const exportNote = (id) => {
  // We can just open this in a new tab or trigger a download via JS
  // Since it's protected by cookies, a simple window.open works for GET if cookies are sent, 
  // but for fetch we can download as blob.
  return api.get(`/notes/${id}/export`, { responseType: 'blob' });
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post('/notes/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
