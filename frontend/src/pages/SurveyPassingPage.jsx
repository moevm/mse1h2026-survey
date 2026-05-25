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

const TEMPLATE_TAG_RE = /\{\{([^{}]+)\}\}/g

const getOptionValue = (option) => (
  typeof option === 'object' && option !== null ? option.value : option
)

const PASSING_DRAFT_PREFIX = 'survey-passing-draft'

const getPassingDraftKey = (surveyId, group) => (
  `${PASSING_DRAFT_PREFIX}:${surveyId}:${group || 'no-group'}`
)

const readPassingDraft = (surveyId, group) => {
  try {
    const rawDraft = window.localStorage.getItem(getPassingDraftKey(surveyId, group))
    return rawDraft ? JSON.parse(rawDraft) : null
  } catch (err) {
    console.error(err)
    return null
  }
}

const savePassingDraft = (surveyId, group, answers) => {
  try {
    window.localStorage.setItem(getPassingDraftKey(surveyId, group), JSON.stringify({
      answers,
      updatedAt: Date.now(),
    }))
  } catch (err) {
    console.error(err)
  }
}

const clearPassingDraft = (surveyId, group) => {
  try {
    window.localStorage.removeItem(getPassingDraftKey(surveyId, group))
  } catch (err) {
    console.error(err)
  }
}

const filterDraftAnswers = (draftAnswers, questions) => {
  const questionIds = new Set(questions.map((question) => String(question.id)))

  return Object.entries(draftAnswers ?? {}).reduce((result, [questionId, value]) => {
    if (questionIds.has(String(questionId))) {
      result[questionId] = value
    }
    return result
  }, {})
}

const replaceBlueprintTags = (value, context) => (
  String(value ?? '').replace(TEMPLATE_TAG_RE, (match, tag) => (
    context[tag] ?? match
  ))
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
      context ? replaceBlueprintTags(getOptionValue(option), context) : getOptionValue(option)
    ))
  }

  if (question.type === 'scale' && question.options && !Array.isArray(question.options)) {
    normalized.min = question.options.min
    normalized.max = question.options.max
    normalized.step = question.options.step
  }

  return normalized
}

const getQuestionTag = (question) => {
  const values = [
    question.title,
    ...(question.answers ?? []).map(getOptionValue),
    ...(Array.isArray(question.options) ? question.options.map(getOptionValue) : []),
  ]

  const tags = values
    .flatMap(value => [...String(value ?? '').matchAll(TEMPLATE_TAG_RE)].map(match => match[1]))

  return tags[0] ?? null
}

const getBlueprintMode = (templateQuestions) => {
  for (const question of templateQuestions) {
    const tag = getQuestionTag(question)
    if (tag === 'teacher' || tag === 'subject') {
      return tag
    }
  }

  return 'teacher'
}

const getScheduleIndexes = (teachers = {}) => {
  const subjectTeachers = {}

  Object.entries(teachers).forEach(([teacher, subjects]) => {
    subjects.forEach((subject) => {
      subjectTeachers[subject] = subjectTeachers[subject] ?? []
      subjectTeachers[subject].push(teacher)
    })
  })

  return { subjectTeachers }
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
    const mode = getBlueprintMode(templateQuestions)
    const { subjectTeachers } = getScheduleIndexes(scheduleData.teachers)

    if (mode === 'subject') {
      Object.entries(subjectTeachers).forEach(([subject, teachers]) => {
        templateQuestions.forEach((templateQuestion) => {
          const tag = getQuestionTag(templateQuestion)

          if (tag === 'teacher') {
            teachers.forEach((teacher) => {
              expanded.push(normalizeQuestion(
                templateQuestion,
                { teacher, subject, group },
                `${question.id}-${subject}-${teacher}-${templateQuestion.id}`,
              ))
            })
            return
          }

          expanded.push(normalizeQuestion(
            templateQuestion,
            { teacher: '', subject, group },
            `${question.id}-${subject}-${templateQuestion.id}`,
          ))
        })
      })
      return
    }

    Object.entries(scheduleData.teachers).forEach(([teacher, subjects]) => {
      templateQuestions.forEach((templateQuestion) => {
        const tag = getQuestionTag(templateQuestion)

        if (tag !== 'subject') {
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

const isAnswerFilled = (value) => {
  if (Array.isArray(value)) {
    return value.some((item) => String(item ?? '').trim())
  }

  return value !== undefined && String(value ?? '').trim() !== ''
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

  const isComplete = questions.every((question) => (
    !question.isRequired || isAnswerFilled(answers[question.id])
  ));

  useEffect(() => {
    const loadSurvey = async () => {
      try {
        const response = await request('GET', `/public/survey/${uuid}`)
        let scheduleData = null

        if (group) {
          try {
            scheduleData = await request('GET', `/group_data/${group}`, { survey_id: uuid })
          } catch (err) {
            console.error(err)
          }
        }

        const nextSurvey = {
          ...response,
          questions: expandBlueprintQuestions(response.questions ?? [], scheduleData, group),
        }
        const draftAnswers = readPassingDraft(uuid, group)?.answers
        setAnswers(filterDraftAnswers(draftAnswers, nextSurvey.questions))
        setSurvey(nextSurvey)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false);
      }
    }
    loadSurvey();
  }, [uuid, group]);

  useEffect(() => {
    if (!survey) return
    savePassingDraft(uuid, group, answers)
  }, [uuid, group, survey, answers])

  const handleFinish = () => {
    clearPassingDraft(uuid, group)
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
