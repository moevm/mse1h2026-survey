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

  const getSurveyAnswerCount = async (id) => {
    try {
      const stats = await request('GET', `/survey/answers/${id}`)
      return stats.count ?? stats.answers_list?.length ?? 0
    } catch {
      return 0
    }
  }

  useEffect(() => {
    const loadSurveys = async () => {
      try {
        const response = await request('GET', `/survey`)
        const surveyList = response.survey_list ?? []
        const surveysWithStats = await Promise.all(
          surveyList.map(async (survey) => ({
            ...survey,
            answers_count: await getSurveyAnswerCount(survey.id)
          }))
        )
        setSurveys(surveysWithStats)
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

  const cloneQuestions = (questions = []) => (
    questions.map((question) => ({
      ...question,
      id: crypto.randomUUID(),
      options: question.type === 'blueprint' && Array.isArray(question.options)
        ? cloneQuestions(question.options)
        : Array.isArray(question.options)
          ? [...question.options]
          : question.options && typeof question.options === 'object'
            ? { ...question.options }
            : question.options
    }))
  )

  const handleClone = async (id) => {
    const targetSurvey = surveys.find((survey) => survey.id === id)
    if (!targetSurvey) return

    const clonedSurvey = {
      ...targetSurvey,
      id: crypto.randomUUID(),
      title: `${targetSurvey.title} Copy`,
      questions: cloneQuestions(targetSurvey.questions),
    }

    try {
      const formData = new FormData()
      formData.append('title', clonedSurvey.title)
      formData.append('description', clonedSurvey.description ?? '')
      formData.append('is_active', clonedSurvey.is_active ?? false)
      formData.append('questions', JSON.stringify(clonedSurvey.questions ?? []))
      formData.append('groups', JSON.stringify(clonedSurvey.groups ?? ['3341']))

      const createdSurvey = await request('POST', '/survey', formData)
      setSurveys((prevSurveys) => [...prevSurveys, { ...createdSurvey, answers_count: 0 }])
    } catch (err) {
      console.error(err)
      setSurveys((prevSurveys) => [...prevSurveys, { ...clonedSurvey, answers_count: 0 }])
    }
  }

  const handleCreate = async () => {
    navigate(`/builder`)
  }

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const escapeHtml = (value) => (
    String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
  )

  const getSurveyStats = async (id) => {
    try {
      return await request('GET', `/survey/answers/${id}`)
    } catch (err) {
      console.error(err)
      return { count: 0, answers_list: [] }
    }
  }

  const getAnswerValues = (answer) => (
    Array.isArray(answer?.answer)
      ? answer.answer.filter((item) => String(item ?? '').trim())
      : []
  )

  const flattenQuestions = (questions = []) => (
    questions.flatMap((question) => (
      question.type === 'blueprint' && Array.isArray(question.options)
        ? flattenQuestions(question.options)
        : [question]
    ))
  )

  const buildExportStats = (survey, stats) => {
    const answers = stats.answers_list ?? []
    const questions = flattenQuestions(survey.questions ?? [])
    const questionById = new Map(questions.map((question) => [String(question.id), question]))
    const resolveQuestionStat = (rawQuestionId) => {
      const questionId = String(rawQuestionId)
      const exactQuestion = questionById.get(questionId)
      if (exactQuestion) {
        return { key: questionId, question: exactQuestion, isExpanded: false }
      }

      const templateQuestion = questions.find((candidate) => questionId.endsWith(`-${candidate.id}`))
      if (templateQuestion) {
        return {
          key: String(templateQuestion.id),
          question: templateQuestion,
          isExpanded: true,
          expandedId: questionId,
        }
      }

      return { key: questionId, question: null, isExpanded: false }
    }
    const groupCounts = {}
    const questionStats = {}

    answers.forEach((answer) => {
      const group = answer.group || 'Без группы'
      const answeredQuestionKeys = new Set()
      groupCounts[group] = (groupCounts[group] ?? 0) + 1

      ;(answer.answers ?? []).forEach((item) => {
        const questionRef = resolveQuestionStat(item.id_question)
        const values = getAnswerValues(item)
        questionStats[questionRef.key] = questionStats[questionRef.key] ?? {
          questionId: questionRef.key,
          question: questionRef.question,
          total: 0,
          choices: {},
          numeric: [],
          expandedIds: new Set(),
        }

        if (questionRef.isExpanded && questionRef.expandedId) {
          questionStats[questionRef.key].expandedIds.add(questionRef.expandedId)
        }

        if (!values.length) return

        answeredQuestionKeys.add(questionRef.key)
        values.forEach((value) => {
          questionStats[questionRef.key].choices[value] = (questionStats[questionRef.key].choices[value] ?? 0) + 1
          const numericValue = Number(value)
          if (Number.isFinite(numericValue)) {
            questionStats[questionRef.key].numeric.push(numericValue)
          }
        })
      })

      answeredQuestionKeys.forEach((questionKey) => {
        questionStats[questionKey].total += 1
      })
    })

    const topGroup = Object.entries(groupCounts).sort((a, b) => b[1] - a[1])[0]
    const answeredSlots = Object.values(questionStats).reduce((sum, item) => sum + item.total, 0)
    const expectedSlots = answers.length * questions.length
    const completion = expectedSlots ? Math.round((answeredSlots / expectedSlots) * 100) : 0

    const summaryRows = [
      {
        metric: 'Количество ответов',
        value: answers.length,
        comment: 'Всего отправленных анкет',
      },
      {
        metric: 'Количество вопросов',
        value: questions.length,
        comment: 'С учетом вопросов внутри шаблонных групп',
      },
      {
        metric: 'Заполненность',
        value: `${completion}%`,
        comment: `${answeredSlots} заполненных ответов из ${expectedSlots}`,
      },
      {
        metric: 'Самая активная группа',
        value: topGroup ? `${topGroup[0]} (${topGroup[1]})` : 'Нет данных',
        comment: 'По числу отправленных анкет',
      },
    ]

    const questionRows = Object.values(questionStats).map((item) => {
      const question = item.question ?? questionById.get(item.questionId)
      const topChoice = Object.entries(item.choices).sort((a, b) => b[1] - a[1])[0]
      const average = item.numeric.length
        ? (item.numeric.reduce((sum, value) => sum + value, 0) / item.numeric.length).toFixed(2)
        : null
      const baseComment = average
        ? `Среднее: ${average}`
        : topChoice
          ? `Частый ответ: ${topChoice[0]} (${topChoice[1]})`
          : 'Нет данных'
      const expandedComment = item.expandedIds.size
        ? `; сгруппировано вариантов: ${item.expandedIds.size}`
        : ''

      return {
        metric: String(question?.title ?? item.questionId),
        value: item.total,
        comment: `${baseComment}${expandedComment}`,
      }
    })

    return [...summaryRows, ...questionRows]
  }

  const buildStatsTable = (survey, stats, fileStats) => {
    const rows = fileStats.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.metric)}</td>
        <td>${escapeHtml(item.value)}</td>
        <td>${escapeHtml(item.comment)}</td>
      </tr>
    `).join('')

    return `
      <h1>${escapeHtml(survey.title)}</h1>
      <p>${escapeHtml(survey.description)}</p>
      <p><b>Ответов:</b> ${stats.count ?? stats.answers_list?.length ?? 0}</p>
      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>Метрика</th>
            <th>Значение</th>
            <th>Комментарий</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `
  }

  const handleExport = async (id, format) => {
    const targetSurvey = surveys.find((survey) => survey.id === id)
    if (!targetSurvey) return

    const stats = await getSurveyStats(id)
    const fileStats = buildExportStats(targetSurvey, stats)
    const table = buildStatsTable(targetSurvey, stats, fileStats)
    const safeTitle = String(targetSurvey.title ?? 'survey').replace(/[\\/:*?"<>|]/g, '_')

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; color: #111; }
            h1 { font-size: 22px; margin-bottom: 8px; }
            p { margin: 6px 0; }
            table { border-collapse: collapse; width: 100%; margin-top: 16px; }
            th, td { border: 1px solid #d0d0d0; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f3f3f3; }
          </style>
        </head>
        <body>${table}</body>
      </html>
    `

    if (format === 'excel') {
      downloadFile(html, `${safeTitle}-stats.xls`, 'application/vnd.ms-excel;charset=utf-8')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleToggle = async (id) => {
    try {
      const targetSurvey = surveys.find((survey) => survey.id === id)
      if (!targetSurvey) return

      await request('PUT', `/survey/${id}`, {
        is_active: !targetSurvey.is_active
      })
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

  if (isLoading) {
    return null
  }

  if (error) {
    return <div>{String(error)}</div>
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
          onClone={handleClone}
          onExport={handleExport}
        />
      </Container>
    </Main>
    <Footer/>
    </>
  )
}
