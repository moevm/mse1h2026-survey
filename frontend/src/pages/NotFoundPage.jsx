import { useNavigate } from 'react-router-dom'
import { Container } from '@shared/ui/container'
import { Card } from '@shared/ui/card'
import { Button } from '@shared/ui/button'
import { Header } from '@widgets/header'
import { Main } from '@widgets/main'
import { Footer } from '@widgets/footer'
import LogoIcon from '@shared/assets/icons/logo.svg?react'

export function NotFoundPage({ message = 'Такой страницы нет или ссылка больше не работает.' }) {
  const navigate = useNavigate()

  return (
    <>
      <Header>
        <Container>
          <LogoIcon />
        </Container>
      </Header>
      <Main>
        <Container>
          <div style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Card style={{
              width: '100%',
              maxWidth: '520px',
              padding: '40px',
              textAlign: 'center',
            }}>
              <h1 style={{ margin: '0 0 12px', fontSize: '42px', lineHeight: 1 }}>
                Страница не найдена
              </h1>
              <p style={{ margin: '0 0 28px', color: '#666', fontSize: '16px' }}>
                {message}
              </p>
              <Button onClick={() => navigate('/login')}>
                На страницу входа
              </Button>
            </Card>
          </div>
        </Container>
      </Main>
      <Footer />
    </>
  )
}
