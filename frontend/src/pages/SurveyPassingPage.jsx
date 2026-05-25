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

const GROUP_ACCESS_DENIED_DETAIL = 'Group is not available for this survey'

const createTemplateTagRegex = () => /\{\{([^{}]+)\}\}/g
const PASSING_QUESTION_TYPES = new Set(['radio', 'checkbox', 'scale', 'text'])

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

const getBaseTag = (tag) => String(tag ?? '').replace(/_\d+$/, '')

const replaceBlueprintTags = (value, context) => (
  String(value ?? '').replace(createTemplateTagRegex(), (match, tag) => {
    const baseTag = getBaseTag(tag)
    const replacement = context[baseTag]

    if (!context.allowedTags?.has(tag)) {
      return match
    }

    if (String(replacement ?? '').trim() === '') {
      return match
    }

    return replacement
  })
)

const hasBlueprintTags = (value) => (
  createTemplateTagRegex().test(String(value ?? ''))
)

const hasUnresolvedBlueprintTags = (question) => {
  const values = [
    question.title,
    ...(question.answers ?? []).map(getOptionValue),
    ...(Array.isArray(question.options) ? question.options.map(getOptionValue) : []),
  ]

  return values.some(hasBlueprintTags)
}

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
  .flatMap(value => [...String(value ?? '').matchAll(createTemplateTagRegex())].map(match => match[1]))

  return tags[0] ?? null
}

const getBlueprintMode = (templateQuestions) => {
  for (const question of templateQuestions) {
    const tag = getBaseTag(getQuestionTag(question))
    if (tag === 'teacher' || tag === 'subject') {
      return tag
    }
  }

  return 'teacher'
}

const getScheduleIndexes = (scheduleData = {}) => {
  const teachers = scheduleData.teachers ?? {}
  const subjectTeachers = {}
  const pairs = Array.isArray(scheduleData.assignments)
    ? scheduleData.assignments.map(({ teacher, subject }) => ({ teacher, subject }))
    : []

  Object.entries(teachers).forEach(([teacher, subjects]) => {
    subjects.forEach((subject) => {
      subjectTeachers[subject] = subjectTeachers[subject] ?? []
      subjectTeachers[subject].push(teacher)

      if (!Array.isArray(scheduleData.assignments)) {
        pairs.push({ teacher, subject })
      }
    })
  })

  return { subjectTeachers, pairs }
}

const getQuestionTags = (question) => {
  const values = [
    question.title,
    ...(question.answers ?? []).map(getOptionValue),
    ...(Array.isArray(question.options) ? question.options.map(getOptionValue) : []),
  ]

return values
  .flatMap(value => [...String(value ?? '').matchAll(createTemplateTagRegex())].map(match => match[1]))
}

const usesTeacherTag = (question) => (
  getQuestionTags(question).some(tag => getBaseTag(tag) === 'teacher')
)

const usesSubjectTag = (question) => (
  getQuestionTags(question).some(tag => getBaseTag(tag) === 'subject')
)

const getFirstRelationMode = (templateQuestions) => {
  for (const question of templateQuestions) {
    for (const tag of getQuestionTags(question)) {
      const baseTag = getBaseTag(tag)
      if (baseTag === 'teacher' || baseTag === 'subject') {
        return baseTag
      }
    }
  }

  return 'teacher'
}

const expandBlueprintQuestions = (questions, scheduleData, group) => {
  if (!scheduleData?.teachers) {
    return questions.map(question => normalizeQuestion(question))
  }

  const expanded = []
  const allowedTags = new Set(scheduleData.allowed_tags ?? ['teacher', 'subject', 'group'])

  questions.forEach((question) => {
    if (question.type !== 'blueprint') {
      expanded.push(normalizeQuestion(question))
      return
    }

    const templateQuestions = Array.isArray(question.options) ? question.options : []
    const mode = getBlueprintMode(templateQuestions)
    const { subjectTeachers, pairs } = getScheduleIndexes(scheduleData)
    const hasTeacherAndSubject = templateQuestions.some(usesTeacherTag) && templateQuestions.some(usesSubjectTag)

if (hasTeacherAndSubject) {
  const primaryMode = getFirstRelationMode(templateQuestions)

  const addQuestion = (templateQuestion, context, fallbackId) => {
    const normalizedQuestion = normalizeQuestion(templateQuestion, context, fallbackId)

    if (!hasUnresolvedBlueprintTags(normalizedQuestion)) {
      expanded.push(normalizedQuestion)
    }
  }

  if (primaryMode === 'subject') {
    const subjectTeacherMap = pairs.reduce((result, { teacher, subject }) => {
      if (!teacher || !subject) return result

      result[subject] = result[subject] ?? []
      result[subject].push(teacher)

      return result
    }, {})

    Object.entries(subjectTeacherMap).forEach(([subject, teachers]) => {
      templateQuestions.forEach((templateQuestion) => {
        const needsTeacher = usesTeacherTag(templateQuestion)
        const needsSubject = usesSubjectTag(templateQuestion)

        if (!needsTeacher) {
          addQuestion(
            templateQuestion,
            { teacher: '', subject, group, allowedTags },
            `${question.id}-${subject}-${templateQuestion.id}`,
          )
          return
        }

        teachers.forEach((teacher) => {
          addQuestion(
            templateQuestion,
            { teacher, subject: needsSubject ? subject : '', group, allowedTags },
            `${question.id}-${subject}-${teacher}-${templateQuestion.id}`,
          )
        })
      })
    })

    return
  }

  const teacherSubjects = pairs.reduce((result, { teacher, subject }) => {
    if (!teacher || !subject) return result

    result[teacher] = result[teacher] ?? []
    result[teacher].push(subject)

    return result
  }, {})

  Object.entries(teacherSubjects).forEach(([teacher, subjects]) => {
    templateQuestions.forEach((templateQuestion) => {
      const needsTeacher = usesTeacherTag(templateQuestion)
      const needsSubject = usesSubjectTag(templateQuestion)

      if (!needsSubject) {
        addQuestion(
          templateQuestion,
          { teacher: needsTeacher ? teacher : '', subject: '', group, allowedTags },
          `${question.id}-${teacher}-${templateQuestion.id}`,
        )
        return
      }

      subjects.forEach((subject) => {
        addQuestion(
          templateQuestion,
          { teacher: needsTeacher ? teacher : '', subject, group, allowedTags },
          `${question.id}-${teacher}-${subject}-${templateQuestion.id}`,
        )
      })
    })
  })

  return
}

    if (mode === 'subject') {
      Object.entries(subjectTeachers).forEach(([subject, teachers]) => {
        templateQuestions.forEach((templateQuestion) => {
          const tag = getBaseTag(getQuestionTag(templateQuestion))

          if (tag === 'teacher') {
            teachers.forEach((teacher) => {
              const normalizedQuestion = normalizeQuestion(
                templateQuestion,
                { teacher, subject, group, allowedTags },
                `${question.id}-${subject}-${teacher}-${templateQuestion.id}`,
              )

              if (!hasUnresolvedBlueprintTags(normalizedQuestion)) {
                expanded.push(normalizedQuestion)
              }
            })
            return
          }

          const normalizedQuestion = normalizeQuestion(
            templateQuestion,
            { teacher: '', subject, group, allowedTags },
            `${question.id}-${subject}-${templateQuestion.id}`,
          )

          if (!hasUnresolvedBlueprintTags(normalizedQuestion)) {
            expanded.push(normalizedQuestion)
          }
        })
      })
      return
    }

    Object.entries(scheduleData.teachers).forEach(([teacher, subjects]) => {
      templateQuestions.forEach((templateQuestion) => {
        const tag = getBaseTag(getQuestionTag(templateQuestion))

        if (tag !== 'subject') {
          const normalizedQuestion = normalizeQuestion(
            templateQuestion,
            { teacher, subject: '', group, allowedTags },
            `${question.id}-${teacher}-${templateQuestion.id}`,
          )

          if (!hasUnresolvedBlueprintTags(normalizedQuestion)) {
            expanded.push(normalizedQuestion)
          }
          return
        }

        subjects.forEach((subject) => {
          const normalizedQuestion = normalizeQuestion(
            templateQuestion,
            { teacher, subject, group, allowedTags },
            `${question.id}-${teacher}-${subject}-${templateQuestion.id}`,
          )

          if (!hasUnresolvedBlueprintTags(normalizedQuestion)) {
            expanded.push(normalizedQuestion)
          }
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
  const [accessDenied, setAccessDenied] = useState(null)
  const questions = (survey?.questions ?? []).filter((question) => (
    PASSING_QUESTION_TYPES.has(question.type)
  ))
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
        setError(null)
        setAccessDenied(null)
        const response = await request('GET', `/public/survey/${uuid}`)
        let scheduleData = null

        if (!group) {
          setAccessDenied({
            title: 'Группа не указана',
            message: 'Опрос открывается по персональной ссылке для группы. Вернитесь на страницу опроса и введите номер своей группы.',
          })
          return
        }

        if (group) {
          try {
            scheduleData = await request('GET', `/group_data/${group}`, { survey_id: uuid })
          } catch (err) {
            console.error(err)
            if (err === GROUP_ACCESS_DENIED_DETAIL) {
              setAccessDenied({
                title: 'Нет доступа к опросу',
                message: `Группа ${group} не добавлена в список групп, которым доступен этот опрос.`,
              })
              return
            }
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
        setAccessDenied({
          title: 'Опрос недоступен',
          message: err === 'Survey is not active'
            ? 'Опрос закрыт и сейчас недоступен для прохождения.'
            : 'Опрос удален или ссылка больше не работает.',
        })
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

  if (accessDenied) {
    return (
      <>
        <Header>
          <Container>
            <LogoIcon />
          </Container>
        </Header>
        <Main>
          <Container className={styles.accessContainer}>
            <section className={styles.accessMessage}>
              <h1>{accessDenied.title}</h1>
              <p>{accessDenied.message}</p>
              <button className={styles.accessButton} onClick={() => navigate('../home')}>
                Вернуться к опросу
              </button>
            </section>
          </Container>
        </Main>
        <Footer />
      </>
    )
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
            key={`${survey.id}:${group}:${questions.map((question) => question.id).join('|')}`}
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
