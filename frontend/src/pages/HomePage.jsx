import { Header } from "@widgets/header";
import { Main } from "@widgets/main";
import { AuthGroupForm } from "@widgets/auth-form";
import { Footer } from "@widgets/footer";
import { SpotLayout } from "@shared/ui/layouts/spot-layout";
import { Button } from "@shared/ui/button";
import { Container } from "@shared/ui/container";
import LogoIcon from "@shared/assets/icons/logo.svg?react";

export const HomePage = () => {
  return (
    <>
      <Header>
        <Container>
          <LogoIcon />
          <Button style={{
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
            <AuthGroupForm />
          </Container>
        </SpotLayout>
      </Main>
      <Footer/>
    </>
  );
}