import { QuestionItem } from './QuestionItem'
import styles from '../SurveyBuilder.module.css'

export const QuestionList = ({ 
  questions, 
  onUpdateQuestion, 
  onRemoveQuestion 
}) => {
  if (questions.length === 0) {
    return (
      <div className={styles.emptyState}>
        Добавьте первый вопрос, чтобы начать создание опроса
      </div>
    )
  }

  return (
    <div className={styles.questionList}>
      {questions.map((question, idx) => (
        <QuestionItem
          key={question.id}
          number={idx + 1}
          question={question}
          onUpdate={onUpdateQuestion}
          onRemove={onRemoveQuestion}
        />
      ))}
    </div>
  )
}