import { Button } from '@shared/ui/button'
import { BlueprintQuestionItem } from './BlueprintQuestionItem'
import styles from '../SurveyBuilder.module.css'

export const BlueprintEditor = ({ options = [], onUpdate }) => {
  const handleAdd = () => {
    onUpdate([...options, {
      id: crypto.randomUUID(),
      title: '',
      type: 'text',
      options: [],
    }])
  }

  const handleRemove = (id) => {
    onUpdate(options.filter(q => q.id !== id))
  }

  const handleUpdate = (id, fields) => {
    onUpdate(options.map(q => q.id === id ? { ...q, ...fields } : q))
  }

  return (
    <div className={styles.blueprintWrapper}>
      {options.map((q, idx) => (
        <BlueprintQuestionItem
          key={q.id}
          number={idx + 1}
          question={q}
          onUpdate={handleUpdate}
          onRemove={() => handleRemove(q.id)}
        />
      ))}
      <Button onClick={handleAdd} className={styles.addBtn}>
        + Добавить вопрос в шаблон
      </Button>
    </div>
  )
}