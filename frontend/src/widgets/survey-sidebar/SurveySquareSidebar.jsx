import clsx from 'clsx'
import styles from './SurveySquareSidebar.module.css'

const TITLE_LIMIT = 36

const getShortTitle = (title, fallback) => {
  const value = String(title ?? fallback ?? '').trim()

  if (value.length <= TITLE_LIMIT) {
    return value
  }

  return `${value.slice(0, TITLE_LIMIT).trim()}...`
}

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
            title={question.title}
          >
            <span className={styles.navNumber}>{index + 1}</span>
            <span className={styles.navTitle}>
              {getShortTitle(question.title, `Вопрос ${index + 1}`)}
            </span>
          </a>
        )
      })}
    </nav>
  )
}
