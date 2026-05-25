import { Droppable, Draggable } from '@hello-pangea/dnd'
import { Button } from '@shared/ui/button'
import { BlueprintQuestionItem } from './BlueprintQuestionItem'
import styles from '../SurveyBuilder.module.css'

const TEMPLATE_TAG_RE = /\{\{([^{}]+)\}\}/g

const getBaseTag = (tag) => String(tag ?? '').replace(/_\d+$/, '')

const getTagSuffix = (tag) => {
  const match = String(tag ?? '').match(/_(\d+)$/)
  return match ? match[1] : '1'
}

const getOptionValue = (option) => (
  typeof option === 'object' && option !== null ? option.value : option
)

const getQuestionTags = (question) => {
  const values = [
    question.title,
    ...(question.answers ?? []).map(getOptionValue),
    ...(Array.isArray(question.options) ? question.options.map(getOptionValue) : []),
  ]

  return values.flatMap((value) => (
    [...String(value ?? '').matchAll(TEMPLATE_TAG_RE)].map((match) => match[1])
  ))
}

const getQuestionTag = (question) => {
  const tags = getQuestionTags(question)
  return tags[0] ?? null
}

const getBlueprintRelationSuffixes = (questions) => {
  const suffixes = new Set()

  questions.forEach((question) => {
    getQuestionTags(question).forEach((tag) => {
      if (['teacher', 'subject'].includes(getBaseTag(tag))) {
        suffixes.add(getTagSuffix(tag))
      }
    })
  })

  return suffixes
}

const getBlueprintModeText = (questions) => {
  for (const question of questions) {
    const tag = getBaseTag(getQuestionTag(question))

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
  const relationSuffixes = getBlueprintRelationSuffixes(options)
  const activeRelationSuffix = relationSuffixes.size === 1 ? [...relationSuffixes][0] : null
  const hasMixedRelationTags = relationSuffixes.size > 1
  const availableBlueprintTags = blueprintTags.filter((tag) => {
    const value = tag.value?.replace('{{', '').replace('}}', '')
    const baseTag = getBaseTag(value)

    if (!activeRelationSuffix || !['teacher', 'subject'].includes(baseTag)) {
      return true
    }

    return getTagSuffix(value) === activeRelationSuffix
  })

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

  const handleMove = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= options.length) return

    const next = [...options]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    onUpdate(next)
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

          {hasMixedRelationTags && (
            <div className={styles.validationMessage}>
              В одной шаблонной группе нельзя смешивать преподавателя/дисциплину из разных листов. Используйте отдельную шаблонную группу для второй пары F-строк.
            </div>
          )}

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
                    blueprintTags={availableBlueprintTags}
                    onUpdate={handleUpdate}
                    onRemove={() => handleRemove(q.id)}
                    onMoveUp={() => handleMove(idx, idx - 1)}
                    onMoveDown={() => handleMove(idx, idx + 1)}
                    canMoveUp={idx > 0}
                    canMoveDown={idx < options.length - 1}
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
