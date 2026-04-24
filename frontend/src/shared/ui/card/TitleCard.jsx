import { Card } from './Card'
import clsx from 'clsx'
import styles from './TitleCard.module.css'

export const TitleCard = ({
  image,
  title,
  description,
  className
}) => {
  return (
    <div className={styles.titleWrapper}>
      <img
        className={styles.titleImage}
        src={image}
        alt="Заголовок опросника"
      />
      <Card className={clsx(styles.card, className)}>
        <h1 className={styles.title}>{title}</h1>
        <hr className={styles.divider}/>
        <p className={styles.description}>{description}</p>
      </Card>
    </div>
  );
}