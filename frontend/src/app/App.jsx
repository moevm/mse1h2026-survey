import {  
  Routes, 
  Route, 
  Navigate,
  BrowserRouter 
} from 'react-router-dom'

import { 
  SurveyPassingPage, 
  SurveyResultPage, 
  SurveyBuilderPage, 
  HealthPage, 
  DashBoardPage, 
  HomePage, 
  LoginPage,
  RegisterPage
} from '@pages';

export function App() {
  const pathParts = window.location.pathname.match(/\/survey\/([^/]+)/);
  const uuid = pathParts?.[1];
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<DashBoardPage />} />
        <Route path="/builder" element={<SurveyBuilderPage />} />
        <Route path="/builder/:id" element={<SurveyBuilderPage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path={`/survey/${uuid}`}>
          <Route index element={<Navigate to={`/survey/${uuid}/home`} replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="passing" element={<SurveyPassingPage />} />
          <Route path="result" element={<SurveyResultPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}