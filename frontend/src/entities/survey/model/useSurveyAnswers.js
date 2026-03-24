import { useState } from "react"

export const useSurveyAnswers = (questions) => {
  const [answers, setAnswers] = useState({})
  const handleChange = (id, value) => {
    setAnswers(prev => (
      {
        ...prev,
        [id]: value
      }
    ));
  }

  const isComplete = questions.every((question) => {
    const val = answers[question.id];
    return val !== undefined && val !== ''
  })

  return {
    answers,
    handleChange,
    isComplete
  }
}