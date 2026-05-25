import { useEffect, useRef, useState } from 'react'
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

const TEMPLATE_TAG_RE = /\{\{[^{}]+\}\}/g

const getOptionValue = (option) => (
  typeof option === 'object' && option !== null ? option.value : option
)

const collectQuestionTagValues = (questions = []) => {
  const tags = new Set()

  const visit = (question) => {
    const values = [
      question.title,
      ...(question.answers ?? []).map(getOptionValue),
      ...(Array.isArray(question.options) ? question.options.map(getOptionValue) : []),
    ]

    values.forEach((value) => {
      String(value ?? '').match(TEMPLATE_TAG_RE)?.forEach((tag) => tags.add(tag))
    })

    if (question.type === 'blueprint' && Array.isArray(question.options)) {
      question.options.forEach(visit)
    }
  }

  questions.forEach(visit)
  return [...tags]
}

const normalizeSurveyForCompare = (survey) => JSON.stringify({
  title: survey.title,
  description: survey.description,
  blueprintLink: survey.blueprintLink,
  selectedBlueprintRows: survey.selectedBlueprintRows,
  isActive: survey.isActive,
  questions: survey.questions,
  groups: survey.groups,
})

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
  availableGroups,
  groups,
  onBlueprintLinkChange,
  onToggleBlueprintRow,
  onSelectAllBlueprintRows,
  onClearBlueprintRows,
  onToggleGroup,
  onSelectAllGroups,
  onClearGroups,
  onManualGroupsChange,
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
        <div className={styles.listHeader}>
          <span className={styles.label}>Шаблонные теги</span>
          <div className={styles.listActions}>
            <button type="button" onClick={onSelectAllBlueprintRows}>Выбрать все</button>
            <button type="button" onClick={onClearBlueprintRows}>Снять все</button>
          </div>
        </div>
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
    <div className={styles.fieldGroup}>
      <div className={styles.listHeader}>
        <span className={styles.label}>Группы, которым доступен опрос</span>
        {availableGroups.length > 0 && (
          <div className={styles.listActions}>
            <button type="button" onClick={onSelectAllGroups}>Выбрать все</button>
            <button type="button" onClick={onClearGroups}>Снять все</button>
          </div>
        )}
      </div>
      {availableGroups.length > 0 ? (
        <>
          <div className={styles.blueprintRows}>
            {availableGroups.map((group) => (
              <label key={group} className={styles.blueprintRowOption}>
                <input
                  type="checkbox"
                  checked={groups.includes(group)}
                  onChange={(e) => onToggleGroup(group, e.target.checked)}
                />
                <span>{group}</span>
              </label>
            ))}
          </div>
          <span className={styles.fieldHint}>
            Группы автоматически подтягиваются из таблицы. Если они не найдены, укажите номера через запятую.
          </span>
        </>
      ) : (
        <>
          <Input
            value={groups.join(', ')}
            onChange={(e) => onManualGroupsChange(e.target.value)}
            placeholder="3341, 3342"
            className={styles.field}
          />
          <span className={styles.fieldHint}>
            Укажите номера групп через запятую. Студенты из других групп увидят страницу без доступа.
          </span>
        </>
      )}
    </div>
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
    selectedBlueprintRows: source.selected_blueprint_rows || source.selectedBlueprintRows || collectQuestionTagValues(source.questions || []),
    isActive: source.is_active ?? source.isActive ?? false,
    questions: (source.questions || []).map(normalizeQuestionForBuilder),
    groups: source.groups || ['3341'],
  }
}

const getQuestionOptions = (question) => question.options ?? question.answers ?? []

const getBlueprintQuestionTagCount = (question) => {
  const values = [
    question.title,
    ...(question.answers ?? []).map(getOptionValue),
    ...(Array.isArray(question.options) ? question.options.map(getOptionValue) : []),
  ]

  return values.reduce((count, value) => (
    count + (String(value ?? '').match(TEMPLATE_TAG_RE)?.length ?? 0)
  ), 0)
}

const getQuestionTagNames = (question) => {
  const values = [
    question.title,
    ...(question.answers ?? []).map(getOptionValue),
    ...(Array.isArray(question.options) ? question.options.map(getOptionValue) : []),
  ]

  return values.flatMap((value) => (
    [...String(value ?? '').matchAll(TEMPLATE_TAG_CAPTURE_RE)].map((match) => match[1])
  ))
}

const hasMixedBlueprintRelationTags = (questions = []) => {
  const suffixes = new Set()

  questions.forEach((question) => {
    getQuestionTagNames(question).forEach((tag) => {
      if (['teacher', 'subject'].includes(getBaseTag(tag))) {
        suffixes.add(getTagSuffix(tag))
      }
    })
  })

  return suffixes.size > 1
}

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
      blueprintQuestions.some((item) => (
        !String(item.title ?? '').trim() ||
        hasInvalidListOptions(item) ||
        getBlueprintQuestionTagCount(item) > 1
      ))
    )
  }
  return !String(question.title ?? '').trim() || hasInvalidListOptions(question)
}

export const SurveyBuilder = ({ initialData }) => {
  const navigate = useNavigate()
  const [survey, setSurvey] = useState(() => getInitialSurvey(initialData))
  const [availableGroups, setAvailableGroups] = useState([])
  const [savedSnapshot, setSavedSnapshot] = useState(() => normalizeSurveyForCompare(getInitialSurvey(initialData)))
  const hasHistoryGuardRef = useRef(false)

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
  const hasUnsavedChanges = normalizeSurveyForCompare(survey) !== savedSnapshot

  const updateMeta = (data) => setSurvey((prev) => ({ ...prev, ...data }))

  useEffect(() => {
    saveBuilderDraft(draftId, survey)
  }, [draftId, survey])

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChanges) return

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (hasUnsavedChanges && !hasHistoryGuardRef.current) {
      window.history.pushState({ surveyBuilderGuard: true }, '', window.location.href)
      hasHistoryGuardRef.current = true
    }

    const handlePopState = () => {
      if (!hasUnsavedChanges) return

      const ok = window.confirm('Вы уверены, что хотите покинуть страницу? Несохраненные изменения будут удалены.')
      if (!ok) {
        window.history.pushState({ surveyBuilderGuard: true }, '', window.location.href)
        return
      }

      clearBuilderDraft(draftId)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [draftId, hasUnsavedChanges])

  const confirmLeaveWithUnsavedChanges = () => (
    !hasUnsavedChanges ||
    window.confirm('Вы уверены, что хотите покинуть страницу? Несохраненные изменения будут удалены.')
  )

  const handleBlueprintLinkChange = (blueprintLink) => {
    setSurvey((prev) => ({
      ...prev,
      blueprintLink,
      blueprintRows: defaultBlueprintRows,
      selectedBlueprintRows: [],
      questions: prev.questions.filter((question) => question.type !== 'blueprint'),
    }))
  }

  useEffect(() => {
    const link = survey.blueprintLink.trim()
    if (!link) return

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await request('POST', '/sheets_columns', {
          url: link,
          delete_old_data: false,
        })
        const columns = response.columns ?? []
        if (!columns.length) return

        setSurvey((prev) => {
          const allowedTags = new Set(columns.map((row) => row.value))
          const selectedBlueprintRows = prev.selectedBlueprintRows.length
            ? prev.selectedBlueprintRows.filter((tag) => allowedTags.has(tag))
            : collectQuestionTagValues(prev.questions).filter((tag) => allowedTags.has(tag))
          return {
            ...prev,
            blueprintRows: columns,
            selectedBlueprintRows,
          }
        })
      } catch (err) {
        console.error(err)
      }
    }, 600)

    return () => window.clearTimeout(timeoutId)
  }, [survey.blueprintLink])

  useEffect(() => {
    const link = survey.blueprintLink.trim()
    if (!link) {
      const timeoutId = window.setTimeout(() => setAvailableGroups([]), 0)
      return () => window.clearTimeout(timeoutId)
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await request('POST', '/sheets_groups', {
          url: link,
          delete_old_data: false,
        })
        const groups = response.groups ?? []
        setAvailableGroups(groups)
        setSurvey((prev) => ({
          ...prev,
          groups: prev.groups.length ? prev.groups.filter((group) => groups.includes(group)) : groups,
        }))
      } catch (err) {
        console.error(err)
      }
    }, 600)

    return () => window.clearTimeout(timeoutId)
  }, [survey.blueprintLink])

  const toggleBlueprintRow = (value, checked) => {
    setSurvey((prev) => ({
      ...prev,
      selectedBlueprintRows: checked
        ? [...prev.selectedBlueprintRows, value]
        : prev.selectedBlueprintRows.filter((item) => item !== value),
    }))
  }

  const toggleGroup = (group, checked) => {
    setSurvey((prev) => ({
      ...prev,
      groups: checked
        ? [...new Set([...prev.groups, group])]
        : prev.groups.filter((item) => item !== group),
    }))
  }

  const handleManualGroupsChange = (value) => {
    setSurvey((prev) => ({
      ...prev,
      groups: value.split(',').map((item) => item.trim()).filter(Boolean),
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

  const importBlueprintData = async (surveyId) => {
    const link = survey.blueprintLink.trim()
    if (!link || !surveyId) return

    await request('POST', `/survey/${surveyId}/set_sheets_link`, {
      url: link,
      delete_old_data: true,
    })
    await request('POST', `/survey/${surveyId}/import_from_sheets`)
  }

  const handleSave = async () => {
    try {
      if (isEditMode) {
        const payload = {
          title: survey.title.trim(),
          description: survey.description.trim(),
          google_sheets_link: survey.blueprintLink.trim(),
          selected_blueprint_rows: survey.selectedBlueprintRows,
          is_active: survey.isActive,
          questions: survey.questions,
          groups: survey.groups,
        }
        await request('PUT', `/survey/${initialData.id}`, payload)
        await importBlueprintData(initialData.id)
      } else {
        const formData = new FormData()
        formData.append('title', survey.title.trim())
        formData.append('description', survey.description.trim())
        formData.append('google_sheets_link', survey.blueprintLink.trim())
        formData.append('selected_blueprint_rows', JSON.stringify(survey.selectedBlueprintRows))
        formData.append('is_active', survey.isActive ? 'true' : 'false')
        formData.append('questions', JSON.stringify(survey.questions))
        formData.append('groups', JSON.stringify(survey.groups))
        if (survey.lifetime_seconds) {
          formData.append('lifetime_seconds', survey.lifetime_seconds)
        }
        const createdSurvey = await request('POST', '/survey', formData)
        await importBlueprintData(createdSurvey.id)
      }
      clearBuilderDraft(draftId)
      setSavedSnapshot(normalizeSurveyForCompare(survey))
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

  const handleCancelChanges = () => {
    clearBuilderDraft(draftId)

    if (isEditMode) {
      const initialSurvey = getInitialSurvey(initialData)
      setSurvey(initialSurvey)
      setSavedSnapshot(normalizeSurveyForCompare(initialSurvey))
      return
    }

    navigate('/dashboard')
  }

  const handleBack = () => {
    if (!confirmLeaveWithUnsavedChanges()) return

    clearBuilderDraft(draftId)
    navigate('/dashboard')
  }

  return (
    <div className={styles.wrapper}>
      <button className={styles.backBtn} onClick={handleBack}>
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
        availableGroups={availableGroups}
        groups={survey.groups}
        onBlueprintLinkChange={handleBlueprintLinkChange}
        onToggleBlueprintRow={toggleBlueprintRow}
        onSelectAllBlueprintRows={() => updateMeta({ selectedBlueprintRows: survey.blueprintRows.map((row) => row.value) })}
        onClearBlueprintRows={() => updateMeta({ selectedBlueprintRows: [] })}
        onToggleGroup={toggleGroup}
        onSelectAllGroups={() => updateMeta({ groups: availableGroups })}
        onClearGroups={() => updateMeta({ groups: [] })}
        onManualGroupsChange={handleManualGroupsChange}
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
      <div className={styles.stickyActions}>
        <Toolbar
          left={
            <Button className={styles.saveBtn} onClick={handleSave} disabled={isSubmitDisabled}>
              {isEditMode ? 'Сохранить изменения' : 'Создать опрос'}
            </Button>
          }
          right={
            <div className={styles.formActions}>
              <Button onClick={handleCancelChanges} className={styles.cancelBtn}>
                {isEditMode ? 'Отменить изменения' : 'Отмена создания'}
              </Button>
              {isEditMode && (
                <Button onClick={handleDelete} className={styles.removeBtn}>
                  Удалить опрос
                </Button>
              )}
            </div>
          }
        />
      </div>
    </div>
  )
}
