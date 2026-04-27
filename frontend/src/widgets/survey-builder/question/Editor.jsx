import { Input } from '@shared/ui/input'
import { Button } from '@shared/ui/button'
import { BlueprintEditor } from '../blueprint/BlueprintEditor'
import { OptionItem } from './OptionItem'
import styles from '../SurveyBuilder.module.css'

const OptionsEditor = ({ options, onUpdate }) => {
  const handleAdd = () => onUpdate([...options, ''])
  const handleRemove = (idx) => onUpdate(options.filter((_, i) => i !== idx))
  const handleChange = (idx, value) => {
    const next = [...options]
    next[idx] = value
    onUpdate(next)
  }

  return (
    <>
      <div className={styles.optionList}>
        {options.map((option, idx) => (
          <OptionItem
            key={idx}
            number={idx + 1}
            value={option}
            onChange={(val) => handleChange(idx, val)}
            onRemove={() => handleRemove(idx)}
          />
        ))}
      </div>
      <Button onClick={handleAdd} className={styles.addBtn}>
        + Добавить вариант
      </Button>
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
            value={options[field]}
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
  radio: ['Вариант 1'],
  checkbox: ['Вариант 1'],
  scale: { min: 0, max: 10, step: 1 },
  blueprint: [],
};

const editorMap = {
  text: () => null,
  radio: OptionsEditor,
  checkbox: OptionsEditor,
  scale: ScaleEditor,
  blueprint: BlueprintEditor,
}

export const Editor = ({ type, options, onUpdate }) => {
  const Component = editorMap[type] ?? (() => null)
  let safeOptions = options;

  if (type === 'scale') {
    if (!options || Array.isArray(options) || typeof options !== 'object') {
      safeOptions = defaultOptions.scale;
    }
  } else {
    if (!Array.isArray(options)) {
      safeOptions = defaultOptions[type] || [];
    }
  }
  return <Component options={safeOptions} onUpdate={onUpdate} />
}