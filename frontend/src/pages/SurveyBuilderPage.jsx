import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'
import { Header } from "@widgets/header";
import { Main } from "@widgets/main";
import { Footer } from "@widgets/footer";
import { Container } from "@shared/ui/container";
import { SurveyBuilder } from '@widgets/survey-builder';
import { request } from '@shared/api/axios';
import LogoIcon from "@shared/assets/icons/logo.svg?react";

export const SurveyBuilderPage = () => {
  const { id } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      const fetchSurvey = async () => {
        try {
          const data = await request('GET', `/survey/${id}`);
          setInitialData(data);
        } catch (err) {
          console.error("Ошибка при загрузке опроса", err);
          alert("Не удалось загрузить данные опроса");
        } finally {
          setLoading(false);
        }
      };
      fetchSurvey();
    }
  }, [id]);

  if (loading) return <div>Загрузка...</div>;

  return (
    <>
      <Header>
        <Container>
          <LogoIcon/>
        </Container>
      </Header>
      <Main>
        <Container>
          <SurveyBuilder initialData={initialData}/>
        </Container>
      </Main>
      <Footer/>
    </>
  )
}