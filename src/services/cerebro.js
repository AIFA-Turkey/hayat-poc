import { tStatic } from '../i18n/translate';

// We use the existing proxy '/cerebro-api' defined in vite.config.js which points to https://www.cerebroaifalabs.com
const CEREBRO_API_BASE = '/cerebro-api'; 

const buildHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || data?.error || (typeof data === 'string' ? data : `HTTP error: ${response.status}`);
    throw new Error(errorMsg);
  }

  return data;
};

export const getWorkspaces = async (userId, token) => {
  if (!userId) throw new Error("User ID is required");
  const url = `${CEREBRO_API_BASE}/core/workspace/user/${userId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(token)
  });
  return handleResponse(response);
};

export const getKnowledgeBases = async (workspaceId, token) => {
  if (!workspaceId) throw new Error("Workspace ID is required");
  const url = `${CEREBRO_API_BASE}/knowledgeai/knowledge-base/workspace/${workspaceId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(token)
  });
  return handleResponse(response);
};

export const getKnowledgeBaseLlmApis = async (kbId, token) => {
  if (!kbId) throw new Error("Knowledge Base ID is required");
  const url = `${CEREBRO_API_BASE}/knowledgeai/knowledge-base/chat/knowledgebasellmapi/${kbId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(token)
  });
  return handleResponse(response);
};

export const getDbVendorAccounts = async (workspaceId, token, page = 1, size = 50) => {
    if (!workspaceId) throw new Error("Workspace ID is required");
    // According to specs: /api/converse/workspace/{workspace_id}/talk-to-data
    const url = `${CEREBRO_API_BASE}/converse/workspace/${workspaceId}/talk-to-data?page=${page}&size=${size}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(token)
    });
    return handleResponse(response);
};

export const getWorkspaceComponents = async (workspaceId, token) => {
    if (!workspaceId) throw new Error("Workspace ID is required");
    const url = `${CEREBRO_API_BASE}/core/workspace/${workspaceId}/components`;
    const response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(token)
    });
    return handleResponse(response);
};
