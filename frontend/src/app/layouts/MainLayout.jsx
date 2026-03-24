import { Outlet } from "react-router-dom"
import styles from './MainLayout.module.css'
import { Header } from '../../widgets/header'
import { Footer } from "../../widgets/footer"

export const MainLayout = ({
  variant = 'default'
}) => {
  return (  
    <div className={styles.wrapper} data-variant={variant}>
      <Header />
      <main className={styles.content}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}