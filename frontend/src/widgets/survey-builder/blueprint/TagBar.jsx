import styles from '../SurveyBuilder.module.css'

export const TagBar = ({ inputRef, value, onChange, tags }) => {
  const handleInsert = (tplValue) => {
    const input = inputRef?.current
    const cur = value ?? ''

    if (!input) {
      onChange(cur + tplValue)
      return
    }

    const start = input.selectionStart
    const end = input.selectionEnd
    const next = cur.substring(0, start) + tplValue + cur.substring(end)
    onChange(next)

    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + tplValue.length, start + tplValue.length)
    }, 0)
  }

  return (
    <div className={styles.tagBar}>
      {tags.map((tag) => (
        <button
          key={tag.value}
          type="button"
          className={styles.tagBtn}
          onClick={() => handleInsert(tag.value)}
        >
          + {tag.option}
          <span className={styles.tagBtnValue}>{tag.value}</span>
        </button>
      ))}
    </div>
  )
}
