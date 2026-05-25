import { Droppable, Draggable } from '@hello-pangea/dnd'
import { Button } from '@shared/ui/button'
import { BlueprintQuestionItem } from './BlueprintQuestionItem'
import styles from '../SurveyBuilder.module.css'

const TEMPLATE_TAG_RE = /\{\{([^{}]+)\}\}/g

const getOptionValue = (option) => (
  typeof option === 'object' && option !== null ? option.value : option
)

const getQuestionTag = (question) => {
  const values = [
    question.title,
    ...(question.answers ?? []).map(getOptionValue),
    ...(Array.isArray(question.options) ? question.options.map(getOptionValue) : []),
  ]

  for (const value of values) {
    const match = String(value ?? '').match(TEMPLATE_TAG_RE)
    if (match) return match[0].replace('{{', '').replace('}}', '')
  }

  return null
}

const getBlueprintModeText = (questions) => {
  for (const question of questions) {
    const tag = getQuestionTag(question)

    if (tag === 'subject') {
      return 'Режим: сначала предмет. Вопросы с преподавателем будут показаны для всех преподавателей выбранного предмета.'
    }

    if (tag === 'teacher') {
      return 'Режим: сначала преподаватель. Вопросы с предметом будут показаны для всех предметов выбранного преподавателя.'
    }
  }

  return 'Добавьте {{teacher}} или {{subject}}, чтобы задать порядок раскрытия шаблона.'
}

export const BlueprintEditor = ({
  questionId,
  options = [],
  startNumber = 1,
  blueprintTags = [],
  onUpdate,
}) => {
  const handleAdd = () => {
    onUpdate([
      ...options,
      {
        id: crypto.randomUUID(),
        title: '',
        type: 'text',
        options: [],
        isRequired: false,
      },
    ])
  }

  const handleRemove = (id) => {
    onUpdate(options.filter((q) => String(q.id) !== String(id)))
  }

  const handleUpdate = (id, fields) => {
    onUpdate(options.map((q) => (String(q.id) === String(id) ? { ...q, ...fields } : q)))
  }

  return (
    <Droppable droppableId={`bq-${questionId}`} type="BLUEPRINT_Q">
      {(provided) => (
        <div
          className={styles.blueprintWrapper}
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <div className={styles.blueprintHint}>
            {getBlueprintModeText(options)}
          </div>

          {options.map((q, idx) => (
            <Draggable key={String(q.id)} draggableId={`bqitem-${String(q.id)}`} index={idx}>
              {(dragProvided, dragSnapshot) => (
                <div
                  ref={dragProvided.innerRef}
                  {...dragProvided.draggableProps}
                  style={{
                    ...dragProvided.draggableProps.style,
                    opacity: dragSnapshot.isDragging ? 0.85 : 1,
                  }}
                >
                  <BlueprintQuestionItem
                    parentId={String(questionId)}
                    number={startNumber + idx}
                    question={{ ...q, id: String(q.id) }}
                    blueprintTags={blueprintTags}
                    onUpdate={handleUpdate}
                    onRemove={() => handleRemove(q.id)}
                    dragHandleProps={dragProvided.dragHandleProps}
                  />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}

          <Button onClick={handleAdd} className={styles.addBtn}>
            + Добавить вопрос в шаблон
          </Button>
        </div>
      )}
    </Droppable>
  )
}
