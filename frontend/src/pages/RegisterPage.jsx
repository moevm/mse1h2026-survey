import { SpotLayout } from '@shared/ui/layouts/spot-layout';
import { Header } from '@widgets/header';
import { Main } from "@widgets/main";
import { Footer } from '@widgets/footer';
import { Container } from '@shared/ui/container';
import { UserAuthForm } from '@widgets/user-auth-form';
import { useNavigate } from 'react-router-dom';
import { request } from '@shared/api/axios';
import LogoIcon from "@shared/assets/icons/logo.svg?react";

export const RegisterPage = () => {
    const navigate = useNavigate();
    const onSubmit = async (data) => {
      try{
        await request("POST", "/register", data);
        navigate("/dashboard");
      }
      catch(e){
  
      }
    }
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
            <UserAuthForm mode="register" onSubmit={onSubmit}/>
          </Container>
        </SpotLayout>
      </Main>
      <Footer />
    </>
  );
};