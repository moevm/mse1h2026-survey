import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'
import { Header } from '@widgets/header';
import { Main } from "@widgets/main";
import { Footer } from '@widgets/footer';
import LogoIcon from "@shared/assets/icons/logo.svg?react";
import { Container } from '@shared/ui/container';
import { SurveyForm } from '@widgets/survey-form';
import { SurveySquareSidebar } from '@widgets/survey-sidebar';
import { request } from '@shared/api/axios';
import styles from './SurveyPassingPage.module.css';

export const SurveyPassingPage = () => {
  const uuid = window.location.pathname.match(/\/survey\/([^/]+)/)?.[1];
  const navigate = useNavigate()
  
  const [survey, setSurvey] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const questions = survey?.questions ?? []
  const [answers, setAnswers] = useState({})
  
  const handleChange = (id, value) => {
    setAnswers(prev => ({ 
      ...prev, 
      [id]: value 
    }));
  };

  const isComplete = questions.every((question) => {
    const val = answers[question.id];
    return val !== undefined && val !== '';
  });

  useEffect(() => {
    const loadSurvey = async () => {
      try {
        const response = await request('GET', `/survey/${uuid}`)
        setSurvey(response)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false);
      }
    }
    loadSurvey();
  }, [uuid]);

  const handleFinish = () => {
    navigate('../result')
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div>Ошибка: {error.message || "Не удалось загрузить опрос"}</div>;
  }

  if (!survey) {
    return <div>Опрос не найден</div>;
  }

  return (
    <>
      <Header>
        <Container>
          <LogoIcon />
        </Container>
      </Header>
      <Main>
        <Container className={styles.containerFlex}>
          <SurveyForm
            survey={survey}
            answers={answers}
            onAnswerChange={handleChange}
            isComplete={isComplete}
            onFinish={handleFinish}
            className={styles.form}
          />
          <SurveySquareSidebar
            questions={questions}
            answers={answers}
            className={styles.sidebar}
          />
        </Container>
      </Main>
      <Footer />
    </>
  );
};