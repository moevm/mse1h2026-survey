import { useNavigate } from 'react-router-dom'
import { Header } from "@widgets/header";
import { Main } from "@widgets/main";
import { AuthGroupForm } from "@widgets/auth-form";
import { Footer } from "@widgets/footer";
import { SpotLayout } from "@shared/ui/layouts/spot-layout";
import { Button } from "@shared/ui/button";
import { Container } from "@shared/ui/container";
import LogoIcon from "@shared/assets/icons/logo.svg?react";

export const HomePage = () => {
  const navigate = useNavigate()
  const onSubmit = (groupCode) => {
    navigate(`/passing?group=${groupCode}`)
  }

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
      <Main>
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