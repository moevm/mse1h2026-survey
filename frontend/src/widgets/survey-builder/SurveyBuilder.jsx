import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiArrowLeftLongLine } from 'react-icons/ri'
import { Input } from '@shared/ui/input'
import { Button } from '@shared/ui/button'
import { Card } from '@shared/ui/card'
import { Toolbar } from '@shared/ui/toolbar'
import { Toggle } from '@shared/ui/toggle'
import { QuestionList } from './question/QuestionList'
import clsx from 'clsx'
import styles from './SurveyBuilder.module.css'
import { request } from '@shared/api/axios'

const defaultBlueprintRows = [
  { option: 'Преподаватель', value: '{{teacher}}' },
  { option: 'Группа', value: '{{group}}' },
  { option: 'Предмет', value: '{{subject}}' },
]

const BUILDER_DRAFT_PREFIX = 'survey-builder-draft'

const getBuilderDraftKey = (id) => `${BUILDER_DRAFT_PREFIX}:${id ?? 'create'}`

const readBuilderDraft = (id) => {
  try {
    const rawDraft = window.localStorage.getItem(getBuilderDraftKey(id))
    return rawDraft ? JSON.parse(rawDraft) : null
  } catch (err) {
    console.error(err)
    return null
  }
}

const saveBuilderDraft = (id, survey) => {
  try {
    window.localStorage.setItem(getBuilderDraftKey(id), JSON.stringify({
      survey,
      updatedAt: Date.now(),
    }))
  } catch (err) {
    console.error(err)
  }
}

const clearBuilderDraft = (id) => {
  try {
    window.localStorage.removeItem(getBuilderDraftKey(id))
  } catch (err) {
    console.error(err)
  }
}

const SurveyStatus = ({ isActive }) => (
  <div className={styles.statusBlock}>
    <span className={styles.statusTitle}>Статус опроса</span>
    <span className={styles.statusValue}>Опрос {isActive ? 'активен' : 'неактивен'}</span>
  </div>
)

const SurveyHeaderEdit = ({ title, description, isActive, onChange }) => (
  <Card className={styles.card}>
    <div className={styles.fieldGroup}>
      <span className={styles.label}>Название опроса</span>
      <Input
        value={title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Название опроса"
        className={styles.field}
      />
    </div>
    <div className={styles.fieldGroup}>
      <span className={styles.label}>Описание</span>
      <textarea
        value={description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Описание опроса"
        className={clsx(styles.field, styles.textarea)}
      />
    </div>
    <Toolbar
      left={<SurveyStatus isActive={isActive} />}
      right={<Toggle checked={isActive} onChange={(val) => onChange({ isActive: val })} />}
    />
  </Card>
)

const BlueprintSettings = ({
  blueprintLink,
  blueprintRows,
  selectedBlueprintRows,
  onBlueprintLinkChange,
  onToggleBlueprintRow,
}) => (
  <Card className={styles.card}>
    <div className={styles.fieldGroup}>
      <span className={styles.label}>Введите ссылку на таблицу</span>
      <Input
        type="url"
        value={blueprintLink}
        onChange={(e) => onBlueprintLinkChange(e.target.value)}
        placeholder="https://example.com"
        className={styles.field}
      />
    </div>
    {blueprintLink.trim() && (
      <div className={styles.fieldGroup}>
        <span className={styles.label}>Шаблонные теги</span>
        <div className={styles.blueprintRows}>
          {blueprintRows.map((row) => (
            <label key={row.value} className={styles.blueprintRowOption}>
              <input
                type="checkbox"
                checked={selectedBlueprintRows.includes(row.value)}
                onChange={(e) => onToggleBlueprintRow(row.value, e.target.checked)}
              />
              <span>{row.option}</span>
              <span className={styles.blueprintRowValue}>{row.value}</span>
            </label>
          ))}
        </div>
      </div>
    )}
  </Card>
)

const normalizeOptions = (options, type) => {
  if (!Array.isArray(options)) return options
  if (!['radio', 'checkbox'].includes(type)) return options
  return options.map((opt) =>
    typeof opt === 'string' ? { id: crypto.randomUUID(), value: opt } : opt
  )
}

const normalizeQuestionForBuilder = (question) => {
  const raw = question.options ?? question.answers ?? []
  const nextQuestion = {
    ...question,
    options: normalizeOptions(raw, question.type),
  }

  if (question.type === 'scale' && question.options && !Array.isArray(question.options)) {
    nextQuestion.options = question.options
  }

  if (question.type === 'blueprint' && Array.isArray(nextQuestion.options)) {
    nextQuestion.options = nextQuestion.options.map(normalizeQuestionForBuilder)
  }

  return nextQuestion
}

const getInitialSurvey = (initialData) => {
  const draft = readBuilderDraft(initialData?.id)?.survey
  const source = draft ?? initialData ?? {}

  return {
    title: source.title || '',
    description: source.description || '',
    blueprintLink: source.google_sheets_link || source.blueprint_link || source.blueprintLink || '',
    blueprintRows: source.blueprint_rows || source.blueprintRows || defaultBlueprintRows,
    selectedBlueprintRows: source.selected_blueprint_rows || source.selectedBlueprintRows || [],
    isActive: source.is_active ?? source.isActive ?? false,
    questions: (source.questions || []).map(normalizeQuestionForBuilder),
    groups: source.groups || ['3341'],
  }
}

const getQuestionOptions = (question) => question.options ?? question.answers ?? []

const hasInvalidListOptions = (question) => {
  if (!['radio', 'checkbox'].includes(question.type)) return false
  const options = getQuestionOptions(question)
  return (
    !Array.isArray(options) ||
    options.length === 0 ||
    options.some((option) => !String(option?.value ?? option).trim())
  )
}

const isInvalidQuestion = (question) => {
  if (question.type === 'blueprint') {
    const blueprintQuestions = Array.isArray(getQuestionOptions(question)) ? getQuestionOptions(question) : []
    return (
      blueprintQuestions.length === 0 ||
      blueprintQuestions.some((item) => !String(item.title ?? '').trim() || hasInvalidListOptions(item))
    )
  }
  return !String(question.title ?? '').trim() || hasInvalidListOptions(question)
}

export const SurveyBuilder = ({ initialData }) => {
  const navigate = useNavigate()
  const [survey, setSurvey] = useState(() => getInitialSurvey(initialData))

  const isEditMode = Boolean(initialData?.id)
  const draftId = initialData?.id

  const hasInvalidQuestions = survey.questions.some(isInvalidQuestion)
  const hasBlueprintLink = Boolean(survey.blueprintLink.trim())
  const blueprintTags = survey.blueprintRows.filter((row) => survey.selectedBlueprintRows.includes(row.value))

  const isSubmitDisabled =
    !survey.title.trim() ||
    !survey.description.trim() ||
    survey.questions.length === 0 ||
    hasInvalidQuestions

  const updateMeta = (data) => setSurvey((prev) => ({ ...prev, ...data }))

  useEffect(() => {
    saveBuilderDraft(draftId, survey)
  }, [draftId, survey])

  const handleBlueprintLinkChange = (blueprintLink) => {
    setSurvey((prev) => ({
      ...prev,
      blueprintLink,
      selectedBlueprintRows: [],
      questions: prev.questions.filter((question) => question.type !== 'blueprint'),
    }))
  }

  const toggleBlueprintRow = (value, checked) => {
    setSurvey((prev) => ({
      ...prev,
      selectedBlueprintRows: checked
        ? [...prev.selectedBlueprintRows, value]
        : prev.selectedBlueprintRows.filter((item) => item !== value),
    }))
  }

  const addQuestion = () => {
    setSurvey((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: crypto.randomUUID(),
          title: '',
          type: 'text',
          options: [],
          isRequired: false,
        },
      ],
    }))
  }

  const removeQuestion = (id) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }))
  }

  const updateQuestion = (id, fields) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === id ? { ...q, ...fields } : q)),
    }))
  }

  const handleReorderQuestions = (nextQuestions) => {
    setSurvey((prev) => ({ ...prev, questions: nextQuestions }))
  }

  const handleSave = async () => {
    try {
      if (isEditMode) {
        const payload = {
          title: survey.title.trim(),
          description: survey.description.trim(),
          blueprint_link: survey.blueprintLink.trim(),
          selected_blueprint_rows: survey.selectedBlueprintRows,
          is_active: survey.isActive,
          questions: survey.questions,
          groups: survey.groups,
        }
        await request('PUT', `/survey/${initialData.id}`, payload)
      } else {
        const formData = new FormData()
        formData.append('title', survey.title.trim())
        formData.append('description', survey.description.trim())
        formData.append('blueprint_link', survey.blueprintLink.trim())
        formData.append('selected_blueprint_rows', JSON.stringify(survey.selectedBlueprintRows))
        formData.append('is_active', survey.isActive ? 'true' : 'false')
        formData.append('questions', JSON.stringify(survey.questions))
        formData.append('groups', JSON.stringify(survey.groups))
        if (survey.lifetime_seconds) {
          formData.append('lifetime_seconds', survey.lifetime_seconds)
        }
        await request('POST', '/survey', formData)
      }
      clearBuilderDraft(draftId)
      navigate('/dashboard')
    } catch (err) {
      console.error('Save error:', err)
      const errorMsg = typeof err === 'string' ? err : err?.response?.data?.detail
      alert(
        typeof errorMsg === 'string'
          ? errorMsg
          : 'Не удалось сохранить опрос. Проверьте правильность заполнения.'
      )
    }
  }

  const handleDelete = async () => {
    if (isEditMode) {
      const ok = window.confirm('Вы уверены, что хотите полностью удалить этот опрос?')
      if (!ok) return
      try {
        await request('DELETE', `/survey/${initialData.id}`)
        clearBuilderDraft(draftId)
        navigate('/dashboard')
      } catch (err) {
        console.error('Delete error:', err)
        alert('Не удалось удалить опрос')
      }
    } else {
      const hasContent = survey.title || survey.questions.length > 0
      if (hasContent) {
        const ok = window.confirm('Отменить создание опроса? Введенные данные будут потеряны.')
        if (!ok) return
      }
      clearBuilderDraft(draftId)
      navigate('/dashboard')
    }
  }

  return (
    <div className={styles.wrapper}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        <RiArrowLeftLongLine size={24} />
        Назад к списку
      </button>
      <div className={styles.headerBlock}>
        <h1 className={styles.pageTitle}>
          {isEditMode ? 'Редактирование опроса' : 'Создание нового опроса'}
        </h1>
        <span className={styles.pageSubtitle}>
          {isEditMode
            ? 'Внесите изменения в существующий опрос'
            : 'Заполните информацию об опросе и добавьте вопросы'}
        </span>
      </div>
      <SurveyHeaderEdit
        title={survey.title}
        description={survey.description}
        isActive={survey.isActive}
        onChange={updateMeta}
      />
      <BlueprintSettings
        blueprintLink={survey.blueprintLink}
        blueprintRows={survey.blueprintRows}
        selectedBlueprintRows={survey.selectedBlueprintRows}
        onBlueprintLinkChange={handleBlueprintLinkChange}
        onToggleBlueprintRow={toggleBlueprintRow}
      />
      <Toolbar
        left={<span className={styles.pageTitle} style={{ fontSize: '20px' }}>Вопросы</span>}
        right={
          <Button
            onClick={addQuestion}
            style={{ padding: '10px 20px', maxWidth: 'fit-content', textWrap: 'nowrap' }}
          >
            Добавить вопрос
          </Button>
        }
      />
      <QuestionList
        questions={survey.questions}
        canUseBlueprint={hasBlueprintLink}
        blueprintTags={blueprintTags}
        onUpdateQuestion={updateQuestion}
        onRemoveQuestion={removeQuestion}
        onReorderQuestions={handleReorderQuestions}
      />
      <Toolbar
        left={
          <Button className={styles.addBtn} onClick={handleSave} disabled={isSubmitDisabled}>
            {isEditMode ? 'Сохранить изменения' : 'Создать опрос'}
          </Button>
        }
        right={
          <Button onClick={handleDelete} className={styles.removeBtn}>
            {isEditMode ? 'Удалить опрос' : 'Отмена создания опроса'}
          </Button>
        }
      />
    </div>
  )
}
