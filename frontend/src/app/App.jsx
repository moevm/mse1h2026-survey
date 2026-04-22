import {  
  Routes, 
  Route, 
  Navigate,
  BrowserRouter 
} from 'react-router-dom'
import { HomePage } from '@pages'
import { SurveyPage } from '@pages'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/survey" element={<SurveyPage />} />
      </Routes>
    </BrowserRouter>
  )
}