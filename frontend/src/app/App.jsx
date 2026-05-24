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
  RegisterPage,
  NotFoundPage // Импортируем нашу новую страницу-заглушку
} from '@pages';

export function App() {
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
        
        {/* Используем двоеточие :uuid — теперь React Router сам поймет динамический адрес */}
        <Route path="/survey/:uuid">
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="passing" element={<SurveyPassingPage />} />
          <Route path="result" element={<SurveyResultPage />} />
        </Route>

        {/* Хэндлер для любых несуществующих страниц (404) */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}