import { useRef } from 'react'
import { FiArrowDown, FiArrowUp, FiTrash2 } from 'react-icons/fi'
import { MdDragIndicator } from 'react-icons/md'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { Input } from '@shared/ui/input'
import { Button } from '@shared/ui/button'
import { Toggle } from '@shared/ui/toggle'
import { Card } from '@shared/ui/card'
import { Toolbar } from '@shared/ui/toolbar'
import { TagBar } from './TagBar'
import { OptionItem } from '../question/OptionItem'
import styles from '../SurveyBuilder.module.css'

const TEMPLATE_TAG_RE = /\{\{[^{}]+\}\}/g

const blueprintQuestionType = {
  text: 'Текстовый',
  radio: 'Радио',
  checkbox: 'Чекбокс',
  scale: 'Шкала',
}

const defaultOptions = {
  text: [],
  radio: [{ id: crypto.randomUUID(), value: 'Вариант 1' }],
  checkbox: [{ id: crypto.randomUUID(), value: 'Вариант 1' }],
  scale: { min: 0, max: 10, step: 1 },
}

const getOptionValue = (option) => (
  typeof option === 'object' && option !== null ? option.value : option
)

const getTemplateTagCount = (question) => {
  const values = [
    question.title,
    ...(question.answers ?? []).map(getOptionValue),
    ...(Array.isArray(question.options) ? question.options.map(getOptionValue) : []),
  ]

  return values.reduce((count, value) => (
    count + (String(value ?? '').match(TEMPLATE_TAG_RE)?.length ?? 0)
  ), 0)
}

export const BlueprintQuestionItem = ({
  parentId,
  question,
  number,
  blueprintTags = [],
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  dragHandleProps,
}) => {
  const titleRef = useRef(null)

  const handleChange = (field, value) => onUpdate(question.id, { [field]: value })

  const handleTypeChange = (newType) => {
    const listTypes = ['radio', 'checkbox']
    const isOldList = listTypes.includes(question.type)
    const isNewList = listTypes.includes(newType)
    const nextOptions = isOldList && isNewList ? question.options : defaultOptions[newType]
    onUpdate(question.id, { type: newType, options: nextOptions })
  }

  const handleOptionAdd = () => {
    const newOption = { id: crypto.randomUUID(), value: '' }
    handleChange('options', [...(question.options ?? []), newOption])
  }

  const handleOptionRemove = (id) => {
    handleChange('options', (question.options ?? []).filter((opt) => String(opt.id) !== String(id)))
  }

  const handleOptionChange = (id, newValue) => {
    const next = (question.options ?? []).map((opt) =>
      String(opt.id) === String(id) ? { ...opt, value: newValue } : opt
    )
    handleChange('options', next)
  }

  const handleScaleChange = (field, value) => {
    handleChange('options', {
      ...question.options,
      [field]: value === '' ? 0 : parseInt(value, 10),
    })
  }

  const showOptions = ['radio', 'checkbox'].includes(question.type)
  const showScale = question.type === 'scale'
  const templateTagCount = getTemplateTagCount(question)
  const optionsDroppableId = `bopt__${parentId}__${question.id}`
  const optionsDndType = `BLUEPRINT_OPT_${question.id}`

  return (
    <Card className={styles.blueprintCard}>
      <div className={styles.blueprintCardHeader}>
        <span {...dragHandleProps} className={styles.dragHandle} aria-label="Перетащить вопрос">
          <MdDragIndicator size={18} />
        </span>
        <span className={styles.blueprintCardNumber}>Вопрос №{number}</span>
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
            <select className={styles.field} value={question.type} onChange={(e) => handleTypeChange(e.target.value)}>
              {Object.entries(blueprintQuestionType).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {blueprintTags.length > 0 && (
          <div className={styles.tagsContainer}>
            <TagBar inputRef={titleRef} value={question.title} onChange={(v) => handleChange('title', v)} tags={blueprintTags} />
          </div>
        )}
      </div>

      {templateTagCount > 1 && (
        <div className={styles.validationMessage}>
          В одном шаблонном вопросе можно использовать только одну F-строку.
        </div>
      )}

      {showOptions && (
        <div className={styles.fieldGroup}>
          <span className={styles.label}>Вариант ответа</span>
          <Droppable droppableId={optionsDroppableId} type={optionsDndType}>
            {(provided) => (
              <div className={styles.optionList} ref={provided.innerRef} {...provided.droppableProps}>
                {(question.options ?? []).map((opt, idx) => (
                  <Draggable key={String(opt.id)} draggableId={`bopt-item-${String(opt.id)}`} index={idx}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        style={{ ...dragProvided.draggableProps.style, opacity: dragSnapshot.isDragging ? 0.85 : 1 }}
                      >
                        <OptionItem
                          number={idx + 1}
                          value={opt.value}
                          onChange={(val) => handleOptionChange(opt.id, val)}
                          onRemove={() => handleOptionRemove(opt.id)}
                          tags={blueprintTags}
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
          <Button onClick={handleOptionAdd} className={styles.addBtn}>+ Добавить вариант</Button>
        </div>
      )}

      {showScale && (
        <div className={styles.scaleRow}>
          {['min', 'max', 'step'].map((field) => {
            const labels = { min: 'Минимум', max: 'Максимум', step: 'Шаг' }
            return (
              <div key={field} className={styles.inputBlock}>
                <span className={styles.label}>{labels[field]}</span>
                <Input type="number" value={question.options?.[field] ?? 0} onChange={(e) => handleScaleChange(field, e.target.value)} className={styles.field} />
              </div>
            )
          })}
        </div>
      )}

      <Toolbar
        left={
          <Toggle
            id={`req-${question.id}`}
            label="Обязательный вопрос"
            checked={Boolean(question.isRequired)}
            onChange={(val) => handleChange('isRequired', val)}
          />
        }
        right={
          <div className={styles.toolbarActions}>
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
            <button type="button" onClick={onRemove} className={styles.removeIconBtn} aria-label="Удалить вопрос">
              <FiTrash2 size={18} />
            </button>
          </div>
        }
      />
    </Card>
  )
}
