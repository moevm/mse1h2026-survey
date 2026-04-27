import { Card } from "./Card"
import { Button } from "../button"
import clsx from "clsx"
import styles from './EmptyCard.module.css'

export const EmptyCard = ({
  onClick,
  className
}) => {
  return (
    <Card className={clsx(styles.emptyCard, className)}>
      <Button className={styles.plusButton} onClick={onClick}>+</Button>
        <div className={styles.content}>
          <h2 className={styles.title}>Нет опросов</h2>
          <p className={styles.description}>Создайте свой первый опрос.</p>
        </div>
    </Card>
  )
}