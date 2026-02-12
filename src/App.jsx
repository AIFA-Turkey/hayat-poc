import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { ApiKeyModal } from './components/ApiKeyModal';

// Pages
import { ExcelToKB } from './pages/ExcelToKB';
import { ExcelToDB } from './pages/ExcelToDB';
import { KBChat } from './pages/KBChat';
import { T2DChat } from './pages/T2DChat';
import { AgentChat } from './pages/AgentChat';

function AppContent() {
  return (
    <>
      <ApiKeyModal />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ExcelToKB />} />
          <Route path="excel-db" element={<ExcelToDB />} />
          <Route path="patent-chat" element={<KBChat />} />
          <Route path="excel-chat" element={<T2DChat />} />
          <Route path="agent-chat" element={<AgentChat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/flowai">
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
