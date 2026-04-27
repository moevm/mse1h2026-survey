import { QuestionField } from '../field/QuestionField';
import styles from './TextQuestion.module.css'

export const TextQuestion = ({
  title,
  id,
  currentStep,
  totalSteps,
  error,
  disabled,
  value,
  onChange,
  placeholder = 'Заполните поле здесь ...',
}) => {
  return (
    <QuestionField
      title={title}
      id={id}
      currentStep={currentStep}
      totalSteps={totalSteps}
      error={error}
      disabled={disabled}
    >
      <textarea
        id={id}
        className={styles.textarea} 
        disabled={disabled}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </QuestionField>
  );
}