import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Dashboard  from './pages/Dashboard';
import Workflows  from './pages/Workflows';
import Executions from './pages/Executions';
import AllLogs    from './pages/AllLogs';
import LogDetail  from './pages/Logs';
import Rules      from './pages/Rules';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/"                  element={<Dashboard />}  />
        <Route path="/workflows"         element={<Workflows />}  />
        <Route path="/executions"        element={<Executions />} />
        <Route path="/executions/:id"    element={<LogDetail />}  />
        <Route path="/logs"              element={<AllLogs />}    />
        <Route path="/rules"             element={<Rules />}      />
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
