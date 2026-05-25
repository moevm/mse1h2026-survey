import { Input } from '@shared/ui/input'
import { Button } from '@shared/ui/button'
import { Card } from '@shared/ui/card'
import { Toggle } from '@shared/ui/toggle'
import { Toolbar } from '@shared/ui/toolbar'
import { Editor } from './Editor'
import { FiArrowDown, FiArrowUp } from 'react-icons/fi'
import { MdDragIndicator } from 'react-icons/md'
import styles from '../SurveyBuilder.module.css'

const questionType = {
  text: 'Текстовый',
  scale: 'Шкала',
  radio: 'Радио',
  checkbox: 'Чекбокс',
  blueprint: 'Шаблонный',
}

const defaultEditContent = {
  text: [],
  scale: { min: 0, max: 10, step: 1 },
  radio: [{ id: crypto.randomUUID(), value: 'Вариант 1' }],
  checkbox: [{ id: crypto.randomUUID(), value: 'Вариант 1' }],
  blueprint: [],
}

export const QuestionItem = ({
  question,
  number,
  canUseBlueprint,
  blueprintTags,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  dragHandleProps,
}) => {
  const isBlueprint = question.type === 'blueprint'

  const handleChange = (field, value) => {
    onUpdate(question.id, { [field]: value })
  }

  const handleTypeChange = (newType) => {
    if (newType === 'blueprint' && !canUseBlueprint) return

    const listTypes = ['radio', 'checkbox']
    const isOldList = listTypes.includes(question.type)
    const isNewList = listTypes.includes(newType)

    const nextOptions =
      isOldList && isNewList ? question.options : defaultEditContent[newType]

    onUpdate(question.id, { type: newType, options: nextOptions })
  }

  return (
    <Card className={styles.card}>
      <div className={styles.questionHeader}>
        <span {...dragHandleProps} className={styles.dragHandle} aria-label="Перетащить вопрос">
          <MdDragIndicator size={20} />
        </span>
        <span className={styles.questionNumber}>
          {isBlueprint
            ? `Шаблонная группа`
            : `Вопрос №${number}`}
        </span>
        <div className={styles.orderControls}>
          <button
            type="button"
            className={styles.orderBtn}
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title="Переместить выше"
          >
            <FiArrowUp size={16} />
          </button>
          <button
            type="button"
            className={styles.orderBtn}
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title="Переместить ниже"
          >
            <FiArrowDown size={16} />
          </button>
        </div>
      </div>

      <div className={styles.row}>
        {!isBlueprint && (
          <div className={styles.inputBlock}>
            <Input
              value={question.title ?? ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Текст вопроса"
              className={styles.field}
            />
          </div>
        )}
        <div className={styles.typeBlock}>
          <span className={styles.label}>Тип вопроса</span>
          <select
            className={styles.field}
            value={question.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            title={
              !canUseBlueprint
                ? 'Введите ссылку на таблицу, чтобы выбрать шаблонный вопрос'
                : undefined
            }
          >
            {Object.entries(questionType).map(([key, label]) => (
              <option
                key={key}
                value={key}
                disabled={key === 'blueprint' && !canUseBlueprint && question.type !== 'blueprint'}
                title={key === 'blueprint' && !canUseBlueprint ? 'Введите ссылку на таблицу' : undefined}
              >
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.inputBlock}>
        <Editor
          questionId={question.id}
          type={question.type}
          options={question.options}
          startNumber={number}
          blueprintTags={blueprintTags}
          onUpdate={(next) => handleChange('options', next)}
        />
      </div>

      <Toolbar
        left={
          !isBlueprint && (
            <Toggle
              id={`req-${question.id}`}
              label="Обязательный вопрос"
              checked={Boolean(question.isRequired)}
              onChange={(val) => handleChange('isRequired', val)}
            />
          )
        }
        right={
          <Button onClick={() => onRemove(question.id)} className={styles.removeBtn}>
            Удалить вопрос
          </Button>
        }
      />
    </Card>
  )
}
