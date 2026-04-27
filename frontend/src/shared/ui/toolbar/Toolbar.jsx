import clsx from 'clsx'
import styles from './Toolbar.module.css'

export const Toolbar = ({
  left,
  middle,
  right,
  className
}) => {
  return (
    <div className={clsx(styles.toolbar, className)}>
      {left && <div className={styles.leftSide}>{left}</div>}
      {middle && <div className={styles.middleSide}>{middle}</div>}
      {right && <div className={styles.rightSide}>{right}</div>}
    </div>
  )
}