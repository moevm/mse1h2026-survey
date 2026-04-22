import clsx from 'clsx'
import styles from './List.module.css'

export const List = ({children, className, ...props}) => {
  return (
    <ul className={clsx(styles.list, className)} {...props}>
      {children}
    </ul>
  )
}

export const ItemList = (children, className, ...props) => {
  return (
    <li className={clsx(styles.item, className)} {...props}>
      {children}
    </li>
  )
}