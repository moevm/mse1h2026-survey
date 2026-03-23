import { Outlet } from "react-router-dom"
import styles from './MainLayout.module.css'

export const MainLayout = ({
  variant = 'default'
}) => {
  return (  
    <div className={styles.wrapper} data-variant={variant}>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}