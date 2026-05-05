import { createElement } from 'react';
import styles from './Card.module.css';

export const Card = ({
  children,
  className,
  as = 'div',
  ...props
}) => {
  return createElement(
    as,
    {
      className: `${styles.card} ${className}`,
      ...props
    },
    children
  )
}
