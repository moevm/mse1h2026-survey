import { useEffect, useState } from 'react'
import {
  Routes,
  Route,
  Navigate,
  BrowserRouter,
} from 'react-router-dom'
import { request } from '@shared/api/axios'

import {
  SurveyPassingPage,
  SurveyResultPage,
  SurveyBuilderPage,
  HealthPage,
  DashBoardPage,
  HomePage,
  LoginPage,
  RegisterPage,
  NotFoundPage,
} from '@pages'

const AdminRoute = ({ children }) => {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let isMounted = true

    const checkAccess = async () => {
      try {
        const user = await request('GET', '/me')
        if (!isMounted) return
        setStatus(user.role === 'admin' ? 'allowed' : 'denied')
      } catch {
        if (isMounted) setStatus('denied')
      }
    }

    checkAccess()

    return () => {
      isMounted = false
    }
  }, [])

  if (status === 'checking') return null
  if (status === 'denied') return <Navigate to="/login" replace />

  return children
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NotFoundPage />} />
        <Route path="/dashboard" element={<AdminRoute><DashBoardPage /></AdminRoute>} />
        <Route path="/builder" element={<AdminRoute><SurveyBuilderPage /></AdminRoute>} />
        <Route path="/builder/:id" element={<AdminRoute><SurveyBuilderPage /></AdminRoute>} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/survey/:uuid">
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="passing" element={<SurveyPassingPage />} />
          <Route path="result" element={<SurveyResultPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
