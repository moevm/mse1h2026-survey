import styles from './RadioDot.module.css'

export const RadioDot = ({
  className = ''
}) => {
  return (
    <span
      className={`${styles.radio} ${className}`}
      aria-hidden
    />
  )
}