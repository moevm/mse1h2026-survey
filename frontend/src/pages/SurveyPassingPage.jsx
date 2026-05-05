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

const replaceBlueprintTags = (value, context) => (
  String(value ?? '')
    .replaceAll('{{teacher}}', context.teacher)
    .replaceAll('{{group}}', context.group)
    .replaceAll('{{subject}}', context.subject)
)

const normalizeQuestion = (question, context = null, fallbackId = question.id) => {
  const title = context ? replaceBlueprintTags(question.title, context) : question.title
  const normalized = {
    ...question,
    id: fallbackId,
    title,
  }

  if (['radio', 'checkbox'].includes(question.type)) {
    normalized.answers = (question.answers ?? question.options ?? []).map(option => (
      context ? replaceBlueprintTags(option, context) : option
    ))
  }

  if (question.type === 'scale' && question.options && !Array.isArray(question.options)) {
    normalized.min = question.options.min
    normalized.max = question.options.max
    normalized.step = question.options.step
  }

  return normalized
}

const questionUsesSubject = (question) => {
  const values = [
    question.title,
    ...(question.answers ?? []),
    ...(Array.isArray(question.options) ? question.options : []),
  ]

  return values.some(value => String(value ?? '').includes('{{subject}}'))
}

const expandBlueprintQuestions = (questions, scheduleData, group) => {
  if (!scheduleData?.teachers) {
    return questions.map(question => normalizeQuestion(question))
  }

  const expanded = []

  questions.forEach((question) => {
    if (question.type !== 'blueprint') {
      expanded.push(normalizeQuestion(question))
      return
    }

    const templateQuestions = Array.isArray(question.options) ? question.options : []

    Object.entries(scheduleData.teachers).forEach(([teacher, subjects]) => {
      templateQuestions.forEach((templateQuestion) => {
        if (!questionUsesSubject(templateQuestion)) {
          expanded.push(normalizeQuestion(
            templateQuestion,
            { teacher, subject: '', group },
            `${question.id}-${teacher}-${templateQuestion.id}`,
          ))
          return
        }

        subjects.forEach((subject) => {
          expanded.push(normalizeQuestion(
            templateQuestion,
            { teacher, subject, group },
            `${question.id}-${teacher}-${subject}-${templateQuestion.id}`,
          ))
        })
      })
    })
  })

  return expanded
}

export const SurveyPassingPage = () => {
  const uuid = window.location.pathname.match(/\/survey\/([^/]+)/)?.[1];
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(window.location.search)
  const group = searchParams.get("group") || "";
  
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
        let scheduleData = null

        if (group) {
          try {
            scheduleData = await request('GET', `/group_data/${group}`)
          } catch (err) {
            console.error(err)
          }
        }

        setSurvey({
          ...response,
          questions: expandBlueprintQuestions(response.questions ?? [], scheduleData, group)
        })
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false);
      }
    }
    loadSurvey();
  }, [uuid, group]);

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
