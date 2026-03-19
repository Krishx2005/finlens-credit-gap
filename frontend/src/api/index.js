/**
 * FinLens API client — all axios calls centralized here.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => config)

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg = error?.response?.data?.detail || error.message || 'API error'
    return Promise.reject(new Error(msg))
  }
)

export const calculateScore = (payload) => api.post('/api/scores/calculate', payload)
export const getDemoScores = () => api.get('/api/scores/demo')
export const getModelInfo = () => api.get('/api/scores/model-info')

export const getAllCounties = () => api.get('/api/geography/counties')
export const getCounty = (fips) => api.get(`/api/geography/county/${fips}`)
export const getDisparities = () => api.get('/api/geography/disparities')
export const getCreditDeserts = () => api.get('/api/geography/credit-deserts')
export const getGeographySummary = () => api.get('/api/geography/summary')

export const getComplaints = (params, signal) => api.get('/api/complaints', { params, signal })
export const getComplaintSummary = () => api.get('/api/complaints/summary')

export const runQuery = (payload) => api.post('/api/query', payload)
export const getQueryExamples = () => api.get('/api/query/examples')
export const getQueryHistory = () => api.get('/api/query/history')

export const getReportPreview = (params) => api.get('/api/reports/preview', { params })
// Use shared instance so interceptors (auth headers, error normalization) apply.
// responseType:'blob' means the interceptor returns the blob directly via response.data.
export const downloadReport = (params) =>
  api.get('/api/reports/download', { params, responseType: 'blob', timeout: 60000 })

export default api
