import { Input } from '@shared/ui/input'
import { Card } from '@shared/ui/card'
import { Toggle } from '@shared/ui/toggle'
import { Button } from '@shared/ui/button'
import { Toolbar } from '@shared/ui/toolbar'
import { Editor } from './Editor'
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
  scale: { min: 0, max: 0, step: 1 },
  radio: ['Вариант 1'],
  checkbox: ['Вариант 1'],
  blueprint: [],
}

export const QuestionItem = ({ 
  question, 
  number, 
  onUpdate, 
  onRemove 
}) => {
  const isBlueprint = question.type === 'blueprint'

  const handleChange = (field, value) => {
    onUpdate(question.id, { [field]: value })
  }

  const handleTypeChange = (newType) => {
    const listTypes = ['radio', 'checkbox']
    const isOldList = listTypes.includes(question.type)
    const isNewList = listTypes.includes(newType)

    const nextOptions = (isOldList && isNewList)
      ? question.options
      : defaultEditContent[newType]

    onUpdate(question.id, { type: newType, options: nextOptions })
  }

  return (
    <Card className={styles.card}>
      <div className={styles.row}>
        {!isBlueprint && (
          <div className={styles.inputBlock}>
            <span className={styles.label}>Вопрос №{number}</span>
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
          >
            {Object.entries(questionType).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.inputBlock}>
        <Editor
          type={question.type}
          options={question.options}
          onUpdate={(next) => handleChange('options', next)}
        />
      </div>

      <Toolbar
        left={
          <Toggle
            id={`req-${question.id}`}
            label="Обязательный вопрос"
            checked={question.isRequired}
            onChange={(val) => handleChange('isRequired', val)}
          />
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