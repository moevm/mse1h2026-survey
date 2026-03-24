import { Card } from '../../shared/ui/card'
import { CARD_CONTENT } from './config'
import styles from './SurveyResultCard.module.css'
import SurveyIcon from '../../../public/survey_icon.svg'
import CheckIcon from './../../../public/checkmark_circle.svg'

export const SurveyResultCard = () => {
  return (
    <Card as='div' className={styles.card}>
      <img 
        src={SurveyIcon} 
        className={styles.logo} 
        alt='Иконка формы'
      />
      <h2 className={styles.title}>{CARD_CONTENT.title}</h2>
      <div className={styles.description}>
        {CARD_CONTENT.description.map((text, idx) => (
          <p key={idx} className={styles.text}>{text}</p>
        ))}
      </div>
      <img
        src={CheckIcon}
        className={styles.checkIcon}
        alt={CARD_CONTENT.checkAlt}
      />
    </Card>
  );
}