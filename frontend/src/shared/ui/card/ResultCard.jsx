import { Card } from './Card';
import clsx from 'clsx';
import styles from './ResultCard.module.css'

export const ResultCard = ({
  logoIcon,
  successIcon,
  schema,
  className,
}) => {
  return (
    <Card as='article' className={clsx(styles.card, className)}>
      {logoIcon}
      <h2 className={styles.title}>{schema.title}</h2>
      <div className={styles.description}>
        {schema.description.map((text, idx) => (
          <p key={idx} className={styles.text}>{text}</p>
        ))}
      </div>
      {successIcon}
    </Card>
  );
}