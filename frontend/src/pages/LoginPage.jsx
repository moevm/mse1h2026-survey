import { SpotLayout } from '@shared/ui/layouts/spot-layout';
import { Header } from '@widgets/header';
import { Main } from "@widgets/main";
import { Footer } from '@widgets/footer';
import { Container } from '@shared/ui/container';
import { UserAuthForm } from '@widgets/user-auth-form';
import LogoIcon from "@shared/assets/icons/logo.svg?react";

export const LoginPage = () => {
  return (
    <>
      <Header>
        <Container>
          <LogoIcon />
        </Container>
      </Header>
      <Main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <SpotLayout>
          <Container>
            <UserAuthForm mode="login" />
          </Container>
        </SpotLayout>
      </Main>
      <Footer />
    </>
  );
};