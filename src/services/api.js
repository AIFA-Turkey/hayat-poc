import { tStatic } from '../i18n/translate';

const buildHeaders = (token, apiKey) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
  'x-api-key': apiKey,
});

const readResponsePayload = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
};

const fetchWithTimeout = async (url, options, timeoutMs) => {
  if (!timeoutMs) {
    return fetch(url, options);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/flowai';
const START_URL_TEMPLATE = import.meta.env.VITE_FLOW_START_URL_TEMPLATE;
const START_QUERY = import.meta.env.VITE_FLOW_START_QUERY;
const STATUS_URL_TEMPLATE = import.meta.env.VITE_FLOW_STATUS_URL_TEMPLATE;

const normalizeProxyUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  return url;
};

const resolveStartUrl = (flowId) => {
  let url = START_URL_TEMPLATE
    ? (START_URL_TEMPLATE.includes('{flowId}')
      ? START_URL_TEMPLATE.replace('{flowId}', flowId)
      : `${START_URL_TEMPLATE.replace(/\/$/, '')}/${flowId}`)
    : `${API_BASE}/api/v1/run/${flowId}`;

  if (START_QUERY) {
    const joiner = url.includes('?') ? '&' : '?';
    url = `${url}${joiner}${START_QUERY}`;
  }
  return normalizeProxyUrl(url);
};

const extractFlowHandle = (data) => {
  if (!data || typeof data !== 'object') return {};
  const statusUrl = data.status_url || data.statusUrl || data.poll_url || data.pollUrl || data.result_url || data.resultUrl || data.url;
  const taskId = data.task_id || data.taskId;
  const runId = data.run_id || data.runId;
  const jobId = data.job_id || data.jobId;

  if (statusUrl || taskId || runId || jobId) {
    return { statusUrl, taskId, runId, jobId };
  }
  if (data.data) return extractFlowHandle(data.data);
  if (data.result) return extractFlowHandle(data.result);
  return {};
};

const resolveStatusUrl = (handle) => {
  if (!handle) return null;
  if (typeof handle === 'string') return normalizeProxyUrl(handle);
  if (handle.statusUrl) return normalizeProxyUrl(handle.statusUrl);

  if (STATUS_URL_TEMPLATE) {
    if (STATUS_URL_TEMPLATE.includes('{taskId}') && handle.taskId) {
      return normalizeProxyUrl(STATUS_URL_TEMPLATE.replace('{taskId}', handle.taskId));
    }
    if (STATUS_URL_TEMPLATE.includes('{runId}') && handle.runId) {
      return normalizeProxyUrl(STATUS_URL_TEMPLATE.replace('{runId}', handle.runId));
    }
    if (STATUS_URL_TEMPLATE.includes('{jobId}') && handle.jobId) {
      return normalizeProxyUrl(STATUS_URL_TEMPLATE.replace('{jobId}', handle.jobId));
    }
    if (STATUS_URL_TEMPLATE.includes('{id}')) {
      const id = handle.taskId || handle.runId || handle.jobId;
      if (id) return normalizeProxyUrl(STATUS_URL_TEMPLATE.replace('{id}', id));
    }
  }

  if (handle.taskId) return `${API_BASE}/api/v1/task/${handle.taskId}`;
  if (handle.runId) return `${API_BASE}/api/v1/run/${handle.runId}`;
  if (handle.jobId) return `${API_BASE}/api/v1/build/${handle.jobId}/events`;
  return null;
};

const SUCCESS_STATUSES = new Set(['success', 'succeeded', 'completed', 'done', 'finished']);
const ERROR_STATUSES = new Set(['error', 'failed', 'failure', 'canceled', 'cancelled', 'revoked']);
const RUNNING_STATUSES = new Set(['pending', 'queued', 'running', 'started', 'in_progress', 'in progress', 'processing', 'retry']);

export const interpretFlowStatus = (data = {}) => {
  const rawStatus = data?.status ?? data?.state ?? data?.phase ?? data?.task_status ?? '';
  const status = typeof rawStatus === 'string' ? rawStatus.toLowerCase() : '';
  const result = data?.result ?? data?.output ?? data?.outputs ?? data?.data ?? data?.response ?? null;
  const error = data?.error ?? data?.detail ?? data?.message ?? null;
  const hasResult = result !== null && result !== undefined;

  const isError = ERROR_STATUSES.has(status) || (!status && error);
  const isSuccess = SUCCESS_STATUSES.has(status) || (hasResult && !ERROR_STATUSES.has(status) && !RUNNING_STATUSES.has(status));
  const isRunning = RUNNING_STATUSES.has(status);

  return { status, result, error, isSuccess, isError, isRunning };
};

export const startFlowRun = async (flowId, payload, token, apiKey, timeoutMs = 1800000) => {
  const url = resolveStartUrl(flowId);
  const headers = buildHeaders(token, apiKey);

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }, timeoutMs);

    const data = await readResponsePayload(response);
    if (!response.ok) {
      const message = data?.detail || data?.message || data?.error || (typeof data === 'string' ? data : null) || `HTTP hatası! durum: ${response.status}`;
      throw new Error(message);
    }
    return { data, handle: extractFlowHandle(data) };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Zaman aşımı: İşlem başlatılamadı. Lütfen tekrar deneyin.');
    }
    throw error;
  }
};

export const getFlowRunStatus = async (handle, token, apiKey, timeoutMs = 15000) => {
  const url = resolveStatusUrl(handle);
  if (!url) {
    throw new Error('Durum kontrolü için geçerli bir URL bulunamadı.');
  }

  const headers = buildHeaders(token, apiKey);
  try {
    const response = await fetchWithTimeout(url, { method: 'GET', headers }, timeoutMs);
    const data = await readResponsePayload(response);
    if (!response.ok) {
      const message = data?.detail || data?.message || data?.error || (typeof data === 'string' ? data : null) || `HTTP hatası! durum: ${response.status}`;
      throw new Error(message);
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Zaman aşımı: Durum kontrolü zaman aşımına uğradı.');
    }
    throw error;
  }
};

export const runFlow = async (flowId, payload, token, apiKey) => {
  const url = `${API_BASE}/api/v1/run/${flowId}`;

  const headers = buildHeaders(token, apiKey);

  console.log(`API Request: ${url}`);
  console.log('Headers:', {
    ...headers,
    Authorization: token ? `Bearer ${token.substring(0, 10)}...` : 'MISSING',
    'x-api-key': apiKey ? `${apiKey.substring(0, 5)}...` : 'MISSING'
  });

  // 30-minute timeout to match the Vite proxy timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1800000);
  const startTime = Date.now();

  const getElapsed = () => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return mins > 0 ? `${mins}dk ${secs}sn` : `${secs}sn`;
  };

  const options = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
    signal: controller.signal,
  };

  try {
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    console.log(`API Response received in ${getElapsed()}`);
    if (!response.ok) {
      const errorText = await response.text();
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { detail: errorText };
      }
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        elapsed: getElapsed(),
        data: errorData
      });

      // Extract the most descriptive error message
      const message = errorData.detail || errorData.message || errorData.error || (typeof errorData === 'string' ? errorData : null) || tStatic('api.httpError', { status: response.status });
      throw new Error(tStatic('api.errorAfter', { message, elapsed: getElapsed() }));
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    const elapsed = getElapsed();
    if (error.name === 'AbortError') {
      console.error(`Request aborted after ${elapsed}`);
      throw new Error(tStatic('api.timeout', { elapsed }));
    }
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error(`Network Error after ${elapsed}:`, error);
      throw new Error(tStatic('api.networkError', { elapsed }));
    }
    console.error(`API Error after ${elapsed}:`, error);
    throw new Error(tStatic('api.errorAfter', { message: error.message, elapsed }));
  }
};

export const FLOW_IDS = {
  // EXCEL_2_KB: 'e40c2ee1-5bb9-466f-bd4e-a9101de0c6da',
  EXCEL_2_KB: import.meta.env.VITE_FLOW_ID_EXCEL_2_KB,

  // EXCEL_2_DB: 'c8089a7b-ac22-433e-a62d-12723d9c6f32',
  EXCEL_2_DB: import.meta.env.VITE_FLOW_ID_EXCEL_2_DB,

  // KB_CHAT: '116b85d2-f5d8-4763-8ca6-468ba00c0b50',
  KB_CHAT: import.meta.env.VITE_FLOW_ID_KB_CHAT,

  // T2D_CHAT: '048d19cb-0a77-46aa-a8dc-f6b2a0c2b283',
  T2D_CHAT: import.meta.env.VITE_FLOW_ID_T2D_CHAT,

  // AGENT_CHAT: '766322bd-a49a-4168-a6f7-a8231fc2ba3f',
  AGENT_CHAT: import.meta.env.VITE_FLOW_ID_AGENT_CHAT,
};
