import { SpotLayout } from "../../app/layouts/SpotLayout";
import { useNavigateOnSubmit } from "../../shared/lib";
import { AuthWelcomeCard } from "../../widgets/auth-welcome-card"
import styles from './HomePage.module.css'

export const HomePage = () => {
  const onSubmit = useNavigateOnSubmit({route: 'survey'})
  return (
    <SpotLayout>
      <AuthWelcomeCard onSubmit={onSubmit}/>
    </SpotLayout>
  );}