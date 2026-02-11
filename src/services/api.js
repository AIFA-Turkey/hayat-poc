export const runFlow = async (flowId, payload, token, apiKey) => {
  const url = `/api/flowai/api/v1/run/${flowId}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-api-key': apiKey,
  };

  console.log(`API Request: ${url}`);
  console.log('Headers:', { 
    ...headers, 
    Authorization: token ? `Bearer ${token.substring(0, 10)}...` : 'MISSING',
    'x-api-key': apiKey ? `${apiKey.substring(0, 5)}...` : 'MISSING'
  });

  const options = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  };

  try {
    const response = await fetch(url, options);
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
        data: errorData
      });
      
      // Extract the most descriptive error message
      const message = errorData.detail || errorData.message || errorData.error || (typeof errorData === 'string' ? errorData : null) || `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error('Network Error / CORS Issue detected:', error);
      throw new Error('Network Error: Failed to connect to Cerebro API. This might be a CORS issue or network connectivity problem.');
    }
    console.error('API Error:', error);
    throw error;
  }
};

export const FLOW_IDS = {
  EXCEL_2_KB: 'e40c2ee1-5bb9-466f-bd4e-a9101de0c6da',
  EXCEL_2_DB: 'c8089a7b-ac22-433e-a62d-12723d9c6f32',
  KB_CHAT: '116b85d2-f5d8-4763-8ca6-468ba00c0b50',
  // KB_CHAT: '050687b3-ae88-48e7-bd2f-bad8f4779a1d',
  T2D_CHAT: '048d19cb-0a77-46aa-a8dc-f6b2a0c2b283',
  // T2D_CHAT: '975daa0f-8f0a-430d-ae22-2aa2b759845d',
  AGENT_CHAT: '766322bd-a49a-4168-a6f7-a8231fc2ba3f',
  // AGENT_CHAT: '80b75a74-9596-4fa0-8611-fae6ec328f27',
};
