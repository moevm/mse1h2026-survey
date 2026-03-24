import styles from './AnswerList.module.css'

export const AnswerList = ({children, className = '' }) => {
  return (
    <ul className={`${styles.list} ${className}`}>
      {children}
    </ul>
  );
}

export const AnswerItem = ({children, className = ''}) => {
  return (
    <li className={`${styles.item} ${className}`}>
      {children}
    </li>
  );
}