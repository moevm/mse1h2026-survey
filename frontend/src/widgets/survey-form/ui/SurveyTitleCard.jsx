import { Card } from "../../../shared/ui/card";
import styles from './SurveyTitleCard.module.css'

export const SurveyTitleCard = ({
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
      <Card className={`${styles.card} ${className}`}>
      <h1 className={styles.title}>{title}</h1>
      <hr className={styles.divider}/>
      <p className={styles.description}>{description}</p>
    </Card>
    </div>
  );
}