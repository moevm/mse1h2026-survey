import { useRef } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import { Input } from '@shared/ui/input'
import { Button } from '@shared/ui/button'
import { OptionItem } from '../question/OptionItem'
import { Card } from '@shared/ui/card'
import { TagBar } from './TagBar'
import styles from '../SurveyBuilder.module.css'

const blueprintTags = [
  { label: 'Преподаватель', value: '{{teacher}}' },
  { label: 'Группа', value: '{{group}}' },
  { label: 'Предмет', value: '{{subject}}' },
]

const blueprintQuestionType = {
  text: 'Текстовый',
  radio: 'Радио',
  checkbox: 'Чекбокс',
  scale: 'Шкала',
}

const defaultOptions = {
  text: [],
  radio: ['Вариант 1'],
  checkbox: ['Вариант 1'],
  scale: { min: 0, max: 10, step: 1 },
}

export const BlueprintQuestionItem = ({ question, number, onUpdate, onRemove }) => {
  const titleRef = useRef(null)

  const handleChange = (field, value) => onUpdate(question.id, { [field]: value })

  const handleTypeChange = (newType) => {
    const listTypes = ['radio', 'checkbox']
    const isOldList = listTypes.includes(question.type)
    const isNewList = listTypes.includes(newType)
    const nextOptions = (isOldList && isNewList) ? question.options : defaultOptions[newType]
    onUpdate(question.id, { type: newType, options: nextOptions })
  }

  const handleOptionAdd = () =>
    handleChange('options', [...(question.options ?? []), ''])

  const handleOptionRemove = (idx) =>
    handleChange('options', question.options.filter((_, i) => i !== idx))

  const handleOptionChange = (idx, value) => {
    const next = [...question.options]
    next[idx] = value
    handleChange('options', next)
  }

  const handleScaleChange = (field, value) => {
    handleChange('options', {
      ...question.options,
      [field]: value === '' ? 0 : parseInt(value, 10)
    })
  }

  const showOptions = ['radio', 'checkbox'].includes(question.type)
  const showScale = question.type === 'scale'

  return (
    <Card className={styles.blueprintCard}>
      <div className={styles.blueprintCardHeader}>
        <span className={styles.blueprintCardNumber}>Вопрос №{number}</span>
        <button
          type="button"
          onClick={onRemove}
          className={styles.removeIconBtn}
          aria-label="Удалить вопрос"
        >
          <FiTrash2 size={18} />
        </button>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.row}>
          <div className={styles.inputBlock}>
            <span className={styles.label}>Текст вопроса</span>
            <Input
              ref={titleRef}
              value={question.title ?? ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Текст вопроса"
              className={styles.field}
            />
          </div>

          <div className={styles.typeBlock}>
            <span className={styles.label}>Тип вопроса</span>
            <select
              className={styles.field}
              value={question.type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              {Object.entries(blueprintQuestionType).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.tagsContainer}>
          <TagBar
            inputRef={titleRef}
            value={question.title}
            onChange={(v) => handleChange('title', v)}
            tags={blueprintTags}
          />
        </div>
      </div>

      {showOptions && (
        <div className={styles.fieldGroup}>
          <span className={styles.label}>Варианты ответа</span>
          <div className={styles.optionList}>
            {(question.options ?? []).map((opt, idx) => (
              <OptionItem
                key={idx}
                number={idx + 1}
                value={opt}
                onChange={(val) => handleOptionChange(idx, val)}
                onRemove={() => handleOptionRemove(idx)}
                tags={blueprintTags}
              />
            ))}
          </div>
          <Button onClick={handleOptionAdd} className={styles.addBtn}>
            + Добавить вариант
          </Button>
        </div>
      )}

      {showScale && (
        <div className={styles.scaleRow}>
          {['min', 'max', 'step'].map((field) => {
            const labels = { min: 'Минимум', max: 'Максимум', step: 'Шаг' }
            return (
              <div key={field} className={styles.inputBlock}>
                <span className={styles.label}>{labels[field]}</span>
                <Input
                  type="number"
                  value={question.options?.[field] ?? 0}
                  onChange={(e) => handleScaleChange(field, e.target.value)}
                  className={styles.field}
                />
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}