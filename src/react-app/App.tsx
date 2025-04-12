import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { ConferencesPage } from './pages/ConferencesPage';
import { ResearchTopicsPage } from './pages/ResearchTopicsPage';
import { ResearchTopicDetailPage } from './pages/ResearchTopicDetailPage';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<ConferencesPage />} />
          <Route path="/conferences" element={<ConferencesPage />} />
          <Route path="/research-topics" element={<ResearchTopicsPage />} />
          <Route path="/research-topics/:id" element={<ResearchTopicDetailPage />} />
          <Route path="*" element={<ConferencesPage />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
