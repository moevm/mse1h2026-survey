import styles from './Card.module.css';

export const Card = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={`${styles.card} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
