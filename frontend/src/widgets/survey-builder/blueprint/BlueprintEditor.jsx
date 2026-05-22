import { Droppable, Draggable } from '@hello-pangea/dnd'
import { Button } from '@shared/ui/button'
import { BlueprintQuestionItem } from './BlueprintQuestionItem'
import styles from '../SurveyBuilder.module.css'

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