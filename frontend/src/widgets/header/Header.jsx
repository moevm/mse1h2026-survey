import  styles  from './Header.module.css'
import  logo_img  from '../../../public/main_logo.svg'
import { Button } from '../../shared/ui/button'

export const Header = () => {
  return (
    <header className={styles.header}>
      <img src={logo_img} alt="" />
      <div className={styles.buttonWrapper}>
        <Button >Log in</Button>
      </div>
    </header>
  )
}