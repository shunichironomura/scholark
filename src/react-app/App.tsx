import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { ConferencesPage } from './pages/ConferencesPage';
import { ResearchTopicsPage } from './pages/ResearchTopicsPage';
import { ResearchTopicDetailPage } from './pages/ResearchTopicDetailPage';
import { SchedulePage } from './pages/SchedulePage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ConferencesPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/conferences"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ConferencesPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/research-topics"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ResearchTopicsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/research-topics/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ResearchTopicDetailPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SchedulePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ConferencesPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
