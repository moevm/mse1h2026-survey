import clsx from "clsx"
import styles from './Container.module.css'

export const Container = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={clsx(styles.container, className)} {...props}>
      {children}
    </div>
  )
}