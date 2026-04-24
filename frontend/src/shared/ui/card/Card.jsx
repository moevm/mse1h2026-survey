import styles from './Card.module.css';

export const Card = ({
  children,
  className,
  as: Component = 'div',
  ...props
}) => {
  return (
    <Component 
      className={`${styles.card} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}