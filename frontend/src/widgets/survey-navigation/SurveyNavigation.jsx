import styles from './SurveyNavigation.module.css'

export const SurveyNavigation = ({ questions, answers }) => {
  const getQuestionStatus = (question) => {
    const val = answers[question.id]
    switch(val) {
      case undefined: return 'untouched'
      case '': return 'unanswered'
      default: return 'answered'
    }
  }

  return (
    <nav className={styles.navigation}>
      {questions.map((question) => {
        return (
          <a 
            key={question.id}
            href={`#question-${question.id}`}
            className={` ${styles.navItem} ${styles[getQuestionStatus(question)]}`}
          >
            {question.id}
          </a>
        )
      })}
    </nav>
  )
}