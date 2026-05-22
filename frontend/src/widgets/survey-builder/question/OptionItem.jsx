import { useRef } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import { MdDragIndicator } from 'react-icons/md'
import { Input } from '@shared/ui/input'
import { TagBar } from '../blueprint/TagBar'
import styles from '../SurveyBuilder.module.css'

export const OptionItem = ({
  number,
  value,
  onChange,
  onRemove,
  tags,
  dragHandleProps,
}) => {
  const inputRef = useRef(null)

  return (
    <div className={styles.optionItemContainer}>
      <div className={styles.optionItem}>
        <span
          {...dragHandleProps}
          className={styles.dragHandle}
          aria-label="Перетащить вариант"
        >
          <MdDragIndicator size={18} />
        </span>

        <span className={styles.answerIndex}>{number}</span>

        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Вариант ${number}`}
          className={styles.field}
        />

        <button
          type="button"
          onClick={onRemove}
          className={styles.removeIconBtn}
          aria-label="Удалить вариант"
        >
          <FiTrash2 size={18} />
        </button>
      </div>

      {tags?.length > 0 && (
        <div className={styles.tagsContainer} style={{ marginLeft: '36px' }}>
          <TagBar
            inputRef={inputRef}
            value={value}
            onChange={onChange}
            tags={tags}
          />
        </div>
      )}
    </div>
  )
}