import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, useMemo } from 'react';
import { StackHandler, StackProvider, StackTheme } from '@stackframe/react';
import { StackClientApp } from '@stackframe/react';
import { useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminPage from './pages/AdminPage';
import CanonBrowsePage from './pages/CanonBrowsePage';
import CanonFolderPageList from './pages/CanonFolderPageList';
import CanonPageView from './pages/CanonPageView';
import TopTheoriesPage from './pages/TopTheoriesPage';
import UsernamePrompt from './components/UsernamePrompt';

function HandlerRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const stackClientApp = useMemo(() => {
    return new StackClientApp({
      projectId: import.meta.env.VITE_STACK_PROJECT_ID || '',
      publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY || '',
      tokenStore: 'cookie',
      redirectMethod: {
        useNavigate: () => navigate,
      },
    });
  }, [navigate]);
  
  return (
    <StackHandler app={stackClientApp} location={location.pathname} fullPage />
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/handler/*" element={<HandlerRoutes />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/canon" element={<CanonBrowsePage />} />
      <Route path="/canon/folder/:id" element={<CanonFolderPageList />} />
      <Route path="/canon/page/:id" element={<CanonPageView />} />
      <Route path="/theories" element={<TopTheoriesPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

function App() {
  const navigate = useNavigate();
  
  const stackClientApp = useMemo(() => {
    return new StackClientApp({
      projectId: import.meta.env.VITE_STACK_PROJECT_ID || '',
      publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY || '',
      tokenStore: 'cookie',
      redirectMethod: {
        useNavigate: () => navigate,
      },
    });
  }, [navigate]);

  return (
    <Suspense fallback="Loading...">
      <StackProvider app={stackClientApp}>
        <StackTheme>
          <UsernamePrompt />
          <AppRoutes />
        </StackTheme>
      </StackProvider>
    </Suspense>
  );
}

export default App;
