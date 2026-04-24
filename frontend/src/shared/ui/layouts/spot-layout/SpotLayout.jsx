import clsx from 'clsx';
import styles from './SpotLayout.module.css'

export const SpotLayout = ({
  children,
  className
}) => {
  return (
    <div className={clsx(styles.wrapper, className)}>
      <div className={styles.decor} aria-hidden='true'>
        <div className={clsx(styles.spot, styles.spotPrimary)} />
        <div className={clsx(styles.spot, styles.spotSecondary)} />
      </div>
      <div style={{position: 'relative', zIndex: 1}}>
        {children}
      </div>
    </div>
  );
}