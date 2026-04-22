import clsx from 'clsx'
import  styles  from './Header.module.css'

export const Header = ({
  children,
  className,
  ...props
}) => {
  return (
    <header className={clsx(styles.header, className)} {...props}>
      {children}
    </header>
  )
}