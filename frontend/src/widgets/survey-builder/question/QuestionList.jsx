import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { QuestionItem } from './QuestionItem'
import styles from '../SurveyBuilder.module.css'

const computeNumbers = (questions) => {
  let counter = 1
  return questions.map((question) => {
    const number = counter
    counter +=
      question.type === 'blueprint'
        ? Array.isArray(question.options) ? question.options.length : 0
        : 1
    return number
  })
}

export const QuestionList = ({
  questions,
  canUseBlueprint,
  blueprintTags,
  onUpdateQuestion,
  onRemoveQuestion,
  onReorderQuestions,
}) => {
  if (questions.length === 0) {
    return (
      <div className={styles.emptyState}>
        Добавьте первый вопрос, чтобы начать создание опроса
      </div>
    )
  }

  const numbers = computeNumbers(questions)

  const handleDragEnd = (result) => {
    const { destination, source, type } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    if (type === 'QUESTION') {
      const next = [...questions]
      const [removed] = next.splice(source.index, 1)
      next.splice(destination.index, 0, removed)
      onReorderQuestions(next)
      return
    }

    if (type === 'BLUEPRINT_Q') {
      const parentId = source.droppableId.replace('bq-', '')
      const parent = questions.find((q) => String(q.id) === String(parentId))
      if (!parent) return
      const next = [...parent.options]
      const [removed] = next.splice(source.index, 1)
      next.splice(destination.index, 0, removed)
      onUpdateQuestion(parent.id, { options: next })
      return
    }

    if (type.startsWith('OPTION_')) {
      const questionId = source.droppableId.replace('opt-', '')
      const question = questions.find((q) => String(q.id) === String(questionId))
      if (!question) return
      const next = [...question.options]
      const [removed] = next.splice(source.index, 1)
      next.splice(destination.index, 0, removed)
      onUpdateQuestion(question.id, { options: next })
      return
    }

    if (type.startsWith('BLUEPRINT_OPT_')) {
      const parts = source.droppableId.split('__')
      const parentId = parts[1]
      const bqId = parts[2]
      const parent = questions.find((q) => String(q.id) === String(parentId))
      if (!parent) return
      const bqIndex = parent.options.findIndex((q) => String(q.id) === String(bqId))
      if (bqIndex === -1) return
      const nextOpts = [...parent.options[bqIndex].options]
      const [removed] = nextOpts.splice(source.index, 1)
      nextOpts.splice(destination.index, 0, removed)
      const nextBlueprintQuestions = parent.options.map((q, i) =>
        i === bqIndex ? { ...q, options: nextOpts } : q
      )
      onUpdateQuestion(parent.id, { options: nextBlueprintQuestions })
      return
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="question-list" type="QUESTION">
        {(provided) => (
          <div
            className={styles.questionList}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {questions.map((question, idx) => (
              <Draggable key={String(question.id)} draggableId={String(question.id)} index={idx}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    style={{
                      ...dragProvided.draggableProps.style,
                      opacity: dragSnapshot.isDragging ? 0.85 : 1,
                    }}
                  >
                    <QuestionItem
                      number={numbers[idx]}
                      question={question}
                      canUseBlueprint={canUseBlueprint}
                      blueprintTags={blueprintTags}
                      onUpdate={onUpdateQuestion}
                      onRemove={onRemoveQuestion}
                      onMoveUp={() => {
                        if (idx === 0) return
                        const next = [...questions]
                        const [moved] = next.splice(idx, 1)
                        next.splice(idx - 1, 0, moved)
                        onReorderQuestions(next)
                      }}
                      onMoveDown={() => {
                        if (idx === questions.length - 1) return
                        const next = [...questions]
                        const [moved] = next.splice(idx, 1)
                        next.splice(idx + 1, 0, moved)
                        onReorderQuestions(next)
                      }}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < questions.length - 1}
                      dragHandleProps={dragProvided.dragHandleProps}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
