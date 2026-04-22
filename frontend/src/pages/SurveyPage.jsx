import { useState } from 'react';
// import { SurveyPassing } from "@widgets/survey-passing";
import { SurveyResult } from "@widgets/survey-result";
import { SpotLayout } from '@shared/ui/layouts/spot-layout';
import { Header } from '@widgets/header';
import { Main } from "@widgets/main";
import { Footer } from '@widgets/footer';
import LogoIcon from "@shared/assets/icons/logo.svg?react";
import { Container } from '@shared/ui/container';

export const SurveyPage = () => {
  const [isCompleted, setIsCompleted] = useState(true);

  const handleFinish = () => {
    setIsCompleted(true);
  };

  return (
    <>
      <Header>
        <Container>
          <LogoIcon />
        </Container>
      </Header>
      <Main>
        {isCompleted ? (
          <SpotLayout>
            <Container>
              <SurveyResult />
            </Container>
          </SpotLayout>
        ) : (
          <SpotLayout>

          </SpotLayout>
        )}
      </Main>
      <Footer />
    </>
  );
};