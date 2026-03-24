import { useNavigate } from "react-router-dom"

export const useNavigateOnSubmit = ({route}) => {
  const navigate = useNavigate();
  // На следующую итерацию 
  // return (id) => {
  //   navigate(`/${route}/${id}`)
  // }
  return () => {
    navigate(`/${route}`)
  }
}