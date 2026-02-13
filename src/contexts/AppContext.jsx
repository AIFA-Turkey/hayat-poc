import { createContext, useContext, useState, useEffect, useRef } from 'react';
import keycloak from '../services/keycloak';
import { useI18n } from './I18nContext';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { t } = useI18n();
  const envApiKey = import.meta.env.VITE_FLOW_AI_API_KEY || '';
  const apiKeyConfirmedFlag = 'FLOW_AI_API_KEY_CONFIRMED';
  const [token, setToken] = useState(null);
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('FLOW_AI_API_KEY') || envApiKey);
  const [apiKeyConfirmed, setApiKeyConfirmed] = useState(() =>
    Boolean(sessionStorage.getItem(apiKeyConfirmedFlag) || sessionStorage.getItem('FLOW_AI_API_KEY'))
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kbChatConfig, setKbChatConfig] = useState({
    knowledgebase_id: import.meta.env.VITE_KB_KNOWLEDGEBASE_ID || '',
    lmapiid: import.meta.env.VITE_KB_LMAPIID || '',
    workspaceid: import.meta.env.VITE_KB_WORKSPACEID || ''
  });
  const [t2dChatConfig, setT2dChatConfig] = useState({
    db_vendor_account_id: import.meta.env.VITE_T2D_VENDOR_ACCOUNT_ID || '',
    lmapiid: import.meta.env.VITE_T2D_LMAPIID || ''
  });
  const [agentChatConfig, setAgentChatConfig] = useState({
    system_prompt: ''
  });
  const [blobStorageConfig, setBlobStorageConfig] = useState({
    connection_string: import.meta.env.VITE_BLOB_CONNECTION_STRING || '',
    container_name: import.meta.env.VITE_BLOB_CONTAINER_NAME || ''
  });
  const [docIntelConfig, setDocIntelConfig] = useState({
    api_key: import.meta.env.VITE_DOC_INTEL_API_KEY || '',
    endpoint: import.meta.env.VITE_DOC_INTEL_ENDPOINT || ''
  });

  const confirmApiKey = () => {
    sessionStorage.setItem(apiKeyConfirmedFlag, 'true');
    setApiKeyConfirmed(true);
  };

  const updateApiKey = (key) => {
    const trimmed = (key || '').trim();
    const nextKey = trimmed || envApiKey;
    setApiKey(nextKey);
    if (trimmed) {
      sessionStorage.setItem('FLOW_AI_API_KEY', trimmed);
    } else {
      sessionStorage.removeItem('FLOW_AI_API_KEY');
    }
    if (nextKey) {
      sessionStorage.setItem(apiKeyConfirmedFlag, 'true');
    } else {
      sessionStorage.removeItem(apiKeyConfirmedFlag);
    }
    setApiKeyConfirmed(Boolean(nextKey));
  };

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initOptions = {
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
      redirectUri: window.location.origin + '/flowai',
      silentCheckSsoRedirectUri: `${window.location.origin}/flowai/silent-check-sso.html`,
    };

    keycloak.init(initOptions).then(authenticated => {
      console.log('Keycloak Auth Result:', authenticated);
      if (authenticated) {
        console.log('Token acquired:', !!keycloak.token);
        setToken(keycloak.token);
        setIsAuthenticated(true);

        // Setup token refresh
        const interval = setInterval(() => {
          keycloak.updateToken(70).then(refreshed => {
            if (refreshed) {
              setToken(keycloak.token);
            }
          }).catch(err => {
            console.error('Failed to refresh token', err);
            keycloak.login();
          });
        }, 60000);

        setLoading(false);
        return () => {
          clearInterval(interval);
        };
      } else {
        keycloak.login();
      }
    }).catch(err => {
      console.error('Keycloak Init Error:', err);
    });
  }, []);

  const resetApiKey = () => {
    sessionStorage.removeItem('FLOW_AI_API_KEY');
    sessionStorage.removeItem(apiKeyConfirmedFlag);
    setApiKey(envApiKey);
    setApiKeyConfirmed(false);
  };

  const logout = () => {
    sessionStorage.removeItem('FLOW_AI_API_KEY');
    sessionStorage.removeItem(apiKeyConfirmedFlag);
    setApiKey(envApiKey);
    setApiKeyConfirmed(false);
    keycloak.logout();
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">{t('auth.keycloakLoading')}</p>
          <p className="text-xs text-slate-400">{t('auth.keycloakHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        token,
        apiKey,
        apiKeyConfirmed,
        isAuthenticated,
        confirmApiKey,
        updateApiKey,
        logout,
        resetApiKey,
        kbChatConfig,
        setKbChatConfig,
        t2dChatConfig,
        setT2dChatConfig,
        agentChatConfig,
        setAgentChatConfig,
        blobStorageConfig,
        setBlobStorageConfig,
        docIntelConfig,
        setDocIntelConfig
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
