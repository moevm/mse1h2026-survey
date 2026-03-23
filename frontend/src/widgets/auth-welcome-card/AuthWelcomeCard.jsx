import { Card } from '../../shared/ui/card'
import { TextField } from '../../shared/ui/text-field'
import { Button } from '../../shared/ui/button'
import { CARD_CONTENT } from './config'
import styles from './AuthWelcomeCard.module.css'
import SurveyIcon from '../../../public/survey_icon.svg'
import { useGroupCode } from '../../features/auth-welcome'

export const AuthWelcomeCard = ({ onSubmit }) => {
  const { 
    groupCode, 
    error, 
    handleChange, 
    handleSubmit
  } = useGroupCode({ onSubmit });
  
  return (
    <Card as='form' className={styles.card} onSubmit={handleSubmit}>
      <img 
        src={SurveyIcon} 
        className={styles.logo} 
        alt={CARD_CONTENT.logoAlt}
      />
      <h2 className={styles.title}>{CARD_CONTENT.title}</h2>
      <div className={styles.description}>
        {CARD_CONTENT.description.map((text, idx) => (
          <p key={idx} className={styles.text}>{text}</p>
        ))}
      </div>
      <TextField
        id={CARD_CONTENT.groupId}
        label={CARD_CONTENT.groupLabel}
        isHiddenLabel
        placeholder={CARD_CONTENT.groupPlaceHolder}
        value={groupCode}
        onChange={handleChange}
        error={error}
      />
      <Button 
        type="submit"
        className={styles.button}
      >
        {CARD_CONTENT.submitText}
      </Button>
    </Card>
  );
}