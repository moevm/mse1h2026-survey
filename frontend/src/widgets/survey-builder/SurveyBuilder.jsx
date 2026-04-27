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
      right={<Toggle isActive={isActive} onChange={(val) => onChange({ isActive: val })} />}
    />
  </Card>
)

export const SurveyBuilder = ({
  initialData
}) => {
  const navigate = useNavigate()
  const [survey, setSurvey] = useState({
    title: '',
    description: '',
    isActive: false,
    questions: [],
    groups: ['3341']
  })

  useEffect(() => {
    if (initialData) {
      setSurvey({
        title: initialData.title || '',
        description: initialData.description || '',
        isActive: initialData.is_active ?? false,
        questions: initialData.questions || [],
        groups: initialData.groups || ['3341']
      });
    }
  }, [initialData]);

  const isEditMode = Boolean(initialData?.id)

  const hasEmptyOptions = survey.questions.some(q =>
    ['radio', 'checkbox'].includes(q.type) &&
    Array.isArray(q.options) &&
    q.options.some(o => o.trim() === '')
  )
  const hasEmptyTitles = survey.questions.some(q => !q.title.trim())

  const isSubmitDisabled =
    !survey.title.trim() ||
    !survey.description.trim() ||
    survey.questions.length === 0 ||
    hasEmptyTitles ||
    hasEmptyOptions

  const updateMeta = (data) => setSurvey(prev => ({ ...prev, ...data }))

  const addQuestion = () => {
    setSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, {
        id: crypto.randomUUID(),
        title: '',
        type: 'text',
        options: [],
        isRequired: false
      }]
    }))
  }

  const removeQuestion = (id) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }))
  }

  const updateQuestion = (id, fields) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...fields } : q)
    }))
  }

  const handleSave = async () => {
  try {
    if (isEditMode) {
      const payload = {
        title: survey.title.trim(),
        description: survey.description.trim(),
        is_active: survey.isActive,
        questions: survey.questions,
        groups: survey.groups,
      };

      await request('PUT', `/survey/${initialData.id}`, payload);
    } else {
      const formData = new FormData();
      
      formData.append('title', survey.title.trim());
      formData.append('description', survey.description.trim());
      formData.append('is_active', survey.isActive);
      
      formData.append('questions', JSON.stringify(survey.questions));
      formData.append('groups', JSON.stringify(survey.groups));
      if (survey.lifetime_seconds) {
        formData.append('lifetime_seconds', survey.lifetime_seconds);
      }
      await request('POST', '/survey', formData);
    }
      navigate('/dashboard');
    } catch (err) {
      console.error("Save error:", err);
      const errorMsg = err.response?.data?.detail;
      alert(
        typeof errorMsg === 'string' 
          ? errorMsg 
          : "Не удалось сохранить опрос. Проверьте правильность заполнения."
      );
    }
  };

  const handleDelete = async () => {
    if (isEditMode) {
      const ok = window.confirm("Вы уверены, что хотите полностью удалить этот опрос?");
      if (!ok) return;

      try {
        await request('DELETE', `/survey/${initialData.id}`);
        navigate('/dashboard');
      } catch (err) {
        console.error("Delete error:", err);
        alert("Не удалось удалить опрос");
      }
    } else {
      const hasContent = survey.title || survey.questions.length > 0;
      if (hasContent) {
        const ok = window.confirm("Отменить создание опроса? Введенные данные будут потеряны.");
        if (!ok) return;
      }
      navigate('/dashboard');
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
          {isEditMode
            ? 'Редактирование опроса' 
            : 'Создание нового опроса'
          }
        </h1>
        <span className={styles.pageSubtitle}>
          {isEditMode
            ? 'Внесите изменения в существующий опрос'
            : 'Заполните информацию об опросе и добавьте вопросы'
          }
        </span>
      </div>
      <SurveyHeaderEdit
        title={survey.title}
        description={survey.description}
        isActive={survey.isActive}
        onChange={updateMeta}
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
        onUpdateQuestion={updateQuestion}
        onRemoveQuestion={removeQuestion}
      />
      <Toolbar 
        left={
          <Button 
            className={styles.addBtn}
            onClick={handleSave}
            disabled={isSubmitDisabled}
          >
            {isEditMode 
              ? 'Сохранить изменения'
              : 'Создать опрос'
            }  
          </Button>
        }
        right={
          <Button 
            onClick={handleDelete}
            className={styles.removeBtn}
          >
            {isEditMode 
              ? 'Удалить опрос'
              : 'Отмена создания опроса'
            }
          </Button>
        }
      />
    </div>
  )
}