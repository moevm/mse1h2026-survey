import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom'
import { Container } from "@shared/ui/container"
import { Header } from "@widgets/header"
import { Main } from "@widgets/main";
import { Footer } from "@widgets/footer";
import { SurveyDashboard } from "@widgets/survey-dashboard";
import { request } from "@shared/api/axios";
import LogoIcon from "@shared/assets/icons/logo.svg?react";

export const DashBoardPage = () => {
  const navigate = useNavigate()
  const [surveys, setSurveys] = useState([]);
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadSurveys = async () => {
      try {
        const response = await request('GET', `/survey`)
        setSurveys(response.survey_list)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false);
      }
    };
    loadSurveys();
  }, []);

  const handleRemove = async (id) => {
    try {
      await request('DELETE', `/survey/${id}`)
      setSurveys((prevSurveys) => {
        if (!prevSurveys) return null
        return prevSurveys.filter(survey => survey.id !== id)
      })
    } catch (err) {
      setError(err)
    }
  }

  const handleEdit = async (id) => {
    navigate(`/builder/${id}`)
  }

  const handleCreate = async () => {
    navigate(`/builder`)
  }

  const handleToggle = async (id) => {
    try {
      await request('PUT', `/survey/${id}`)
      setSurveys((prevSurveys) => 
        prevSurveys.map((survey) => 
          survey.id === id 
            ? { ...survey, is_active: !survey.is_active }
            : survey
          )
        );
    } catch (err) {
      console.error(err)
      setError(err)
    }
  }

  return (
    <>
      <Header>
      <Container>
        <LogoIcon />
      </Container>
    </Header>
    <Main>
      <Container>
        <SurveyDashboard 
          surveys={surveys}
          onCreate={handleCreate}
          onDelete={handleRemove}
          onEdit={handleEdit}
          onToggle={handleToggle}
        />
      </Container>
    </Main>
    <Footer/>
    </>
  )
}