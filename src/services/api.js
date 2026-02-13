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
      const message = errorData.detail || errorData.message || errorData.error || (typeof errorData === 'string' ? errorData : null) || `HTTP hatası! durum: ${response.status}`;
      throw new Error(`${message} (${getElapsed()} sonra)`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    const elapsed = getElapsed();
    if (error.name === 'AbortError') {
      console.error(`Request aborted after ${elapsed}`);
      throw new Error(`Zaman aşımı: API isteği ${elapsed} sonra zaman aşımına uğradı (AbortController). Lütfen tekrar deneyin.`);
    }
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error(`Network Error after ${elapsed}:`, error);
      throw new Error(`Ağ Hatası: ${elapsed} sonra bağlantı kesildi. Bu Vite proxy zaman aşımı, CORS sorunu veya ağ bağlantı problemi olabilir.`);
    }
    console.error(`API Error after ${elapsed}:`, error);
    throw new Error(`${error.message} (${elapsed} sonra)`);
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
