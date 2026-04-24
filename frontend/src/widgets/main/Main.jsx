import styles from './Main.module.css'
import clsx from 'clsx'

export const Main = ({
  children,
  className,
  ...props
}) => {
  return (
    <main className={clsx(styles.main, className)} {...props}>
      {children}
    </main>
  )
}