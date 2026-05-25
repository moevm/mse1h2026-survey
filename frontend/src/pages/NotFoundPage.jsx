import { useNavigate } from 'react-router-dom'
import { Container } from '@shared/ui/container'
import { Card } from '@shared/ui/card'
import { Button } from '@shared/ui/button'
import { Header } from '@widgets/header'
import { Main } from '@widgets/main'
import { Footer } from '@widgets/footer'
import LogoIcon from '@shared/assets/icons/logo.svg?react'
import styles from './NotFoundPage.module.css'

export function NotFoundPage({ message = 'Такой страницы нет или ссылка больше не работает.' }) {
  const navigate = useNavigate()

  return (
    <>
      <Header>
        <Container>
          <LogoIcon />
        </Container>
      </Header>
      <Main className={styles.main}>
        <Container className={styles.container}>
          <div className={styles.content}>
            <Card className={styles.card}>
              <h1 className={styles.title}>
                Страница не найдена
              </h1>
              <p className={styles.message}>
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
