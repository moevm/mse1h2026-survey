import { useNavigateOnSubmit } from "../../../shared/lib"

export const useSubmitSurvey = (answers, isComplete) => {
  const navigateToResults = useNavigateOnSubmit({ route: 'result'})
  
  const handleSubmit = () => {
    if (!isComplete) return 
    navigateToResults();
  }

  return { handleSubmit }
}