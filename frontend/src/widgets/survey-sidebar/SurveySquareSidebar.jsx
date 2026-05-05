import clsx from 'clsx'
import styles from './SurveySquareSidebar.module.css'

export const SurveySquareSidebar = ({ 
  questions, 
  answers,
  className 
}) => {
  const getQuestionStatus = (question) => {
    const val = answers[question.id]
    switch(val) {
      case undefined: return 'untouched'
      case '': return 'unanswered'
      default: return 'answered'
    }
  }

  return (
    <nav className={clsx(styles.navigation, className)}>
      {questions.map((question, index) => {
        return (
          <a 
            key={question.id}
            href={`#question-${question.id}`}
            className={clsx(styles.navItem, styles[getQuestionStatus(question)])}
          >
            {index + 1}
          </a>
        )
      })}
    </nav>
  )
}
