import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { HomePage } from '../pages/home'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route element={<MainLayout variant='welcome' /> } >
          <Route path="/home" element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}