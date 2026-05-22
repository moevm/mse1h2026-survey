import { Droppable, Draggable } from '@hello-pangea/dnd'
import { Input } from '@shared/ui/input'
import { Button } from '@shared/ui/button'
import { BlueprintEditor } from '../blueprint/BlueprintEditor'
import { OptionItem } from './OptionItem'
import styles from '../SurveyBuilder.module.css'

export const OptionsEditor = ({ questionId, options = [], onUpdate }) => {
  const handleAdd = () => {
    const newOption = { id: crypto.randomUUID(), value: '' }
    onUpdate([...options, newOption])
  }

  const handleRemove = (id) => onUpdate(options.filter((opt) => String(opt.id) !== String(id)))

  const handleChange = (id, value) => {
    const next = options.map((opt) => (String(opt.id) === String(id) ? { ...opt, value } : opt))
    onUpdate(next)
  }

  return (
    <>
      <Droppable droppableId={`opt-${questionId}`} type={`OPTION_${questionId}`}>
        {(provided) => (
          <div className={styles.optionList} ref={provided.innerRef} {...provided.droppableProps}>
            {options.map((opt, idx) => (
              <Draggable key={String(opt.id)} draggableId={`opt-item-${String(opt.id)}`} index={idx}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    style={{
                      ...dragProvided.draggableProps.style,
                      opacity: dragSnapshot.isDragging ? 0.85 : 1,
                    }}
                  >
                    <OptionItem
                      number={idx + 1}
                      value={opt.value}
                      onChange={(val) => handleChange(opt.id, val)}
                      onRemove={() => handleRemove(opt.id)}
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
      <Button onClick={handleAdd} className={styles.addBtn}>+ Добавить вариант</Button>
    </>
  )
}

const ScaleEditor = ({ options, onUpdate }) => {
  const labels = { min: 'Минимум', max: 'Максимум', step: 'Шаг' }

  const handleChange = (field, value) => {
    onUpdate({ ...options, [field]: value === '' ? 0 : parseInt(value, 10) })
  }

  return (
    <div className={styles.scaleRow}>
      {['min', 'max', 'step'].map((field) => (
        <div key={field} className={styles.inputBlock}>
          <span className={styles.label}>{labels[field]}</span>
          <Input
            type="number"
            value={options[field] ?? 0}
            onChange={(e) => handleChange(field, e.target.value)}
            className={styles.field}
          />
        </div>
      ))}
    </div>
  )
}

const defaultOptions = {
  text: [],
  radio: [{ id: crypto.randomUUID(), value: 'Вариант 1' }],
  checkbox: [{ id: crypto.randomUUID(), value: 'Вариант 1' }],
  scale: { min: 0, max: 10, step: 1 },
  blueprint: [],
}

export const Editor = ({
  questionId,
  type,
  options,
  startNumber = 1,
  blueprintTags = [],
  onUpdate,
}) => {
  let safeOptions = options

  if (type === 'scale') {
    if (!options || Array.isArray(options) || typeof options !== 'object') {
      safeOptions = defaultOptions.scale
    }
  } else {
    if (!Array.isArray(options)) {
      safeOptions = defaultOptions[type] || []
    } else if (['radio', 'checkbox'].includes(type)) {
      safeOptions = options.map((opt) =>
        typeof opt === 'string'
          ? { id: crypto.randomUUID(), value: opt }
          : { ...opt, id: String(opt.id) }
      )
    }
  }

  if (type === 'text') return null

  if (type === 'scale') {
    return <ScaleEditor options={safeOptions} onUpdate={onUpdate} />
  }

  if (type === 'blueprint') {
    return (
      <BlueprintEditor
        questionId={questionId}
        options={safeOptions}
        startNumber={startNumber}
        blueprintTags={blueprintTags}
        onUpdate={onUpdate}
      />
    )
  }

  return (
    <OptionsEditor
      questionId={questionId}
      options={safeOptions}
      onUpdate={onUpdate}
    />
  )
}