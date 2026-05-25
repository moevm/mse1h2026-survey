import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Header } from "@widgets/header";
import { Main } from "@widgets/main";
import { AuthGroupForm } from "@widgets/auth-form";
import { Footer } from "@widgets/footer";
import { SpotLayout } from "@shared/ui/layouts/spot-layout";
import { Button } from "@shared/ui/button";
import { Container } from "@shared/ui/container";
import LogoIcon from "@shared/assets/icons/logo.svg?react";
import { request } from '@shared/api/axios';

export const HomePage = () => {
  const navigate = useNavigate()
  const { uuid } = useParams()
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    const checkSurvey = async () => {
      try {
        await request('GET', `/public/survey/${uuid}`)
        setStatus('available')
      } catch {
        setStatus('unavailable')
      }
    }

    checkSurvey()
  }, [uuid])

  const onSubmit = (groupCode) => {
    navigate(`../passing?group=${groupCode}`)
  }

  if (status === 'checking') return <div>Загрузка...</div>
  if (status === 'unavailable') return <div>Опрос не найден или недоступен</div>

  return (
    <>
      <Header>
        <Container>
          <LogoIcon />
          <Button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '90px',
              height: '40px'
            }}>Log in</Button>
        </Container>
      </Header>
      <Main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <SpotLayout>
          <Container>
            <AuthGroupForm onSubmit={onSubmit}/>
          </Container>
        </SpotLayout>
      </Main>
      <Footer/>
    </>
  );
}
