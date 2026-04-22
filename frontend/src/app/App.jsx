import {  
  Routes, 
  Route, 
  Navigate,
  BrowserRouter 
} from 'react-router-dom'
import { HomePage } from '@pages'
import { SurveyPassingPage, SurveyResultPage } from '@pages';

export function App() {
  const pathParts = window.location.pathname.match(/\/survey\/([^/]+)/);
  const uuid = pathParts?.[1];
  const basename = `/survey/${uuid}`;
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/passing" element={<SurveyPassingPage />} />
        <Route path="/result" element={<SurveyResultPage />} />
      </Routes>
    </BrowserRouter>
  )
}