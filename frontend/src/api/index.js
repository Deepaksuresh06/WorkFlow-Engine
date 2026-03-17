import api from './client';

export const workflowAPI = {
  list:           (p)     => api.get('/workflows', { params: p }),
  create:         (d)     => api.post('/workflows', d),
  get:            (id)    => api.get(`/workflows/${id}`),
  update:         (id, d) => api.put(`/workflows/${id}`, d),
  delete:         (id)    => api.delete(`/workflows/${id}`),
  publish:        (id)    => api.post(`/workflows/${id}/publish`),
  trigger:        (id, d) => api.post(`/workflows/${id}/execute`, d),
  listExecutions: (id, p) => api.get(`/workflows/${id}/executions`, { params: p }),
};

export const executionAPI = {
  listAll:  (p)  => api.get('/executions', { params: p }),
  get:      (id) => api.get(`/executions/${id}`),
  cancel:   (id) => api.post(`/executions/${id}/cancel`),
  retry:    (id) => api.post(`/executions/${id}/retry`),
  stepLogs: (id) => api.get(`/executions/${id}/steps`),
};

export const ruleAPI = {
  list:   ()       => api.get('/rules'),
  create: (d)      => api.post('/rules', d),
  update: (id, d)  => api.put(`/rules/${id}`, d),
  delete: (id)     => api.delete(`/rules/${id}`),
};
