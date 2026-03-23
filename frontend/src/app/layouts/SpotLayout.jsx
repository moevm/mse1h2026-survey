import styles from './SpotLayout.module.css'

export const SpotLayout = ({
  children
}) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.decor} aria-hidden='true'>
        <div className={styles.spotPrimary} />
        <div className={styles.spotSecondary} />
      </div>
      {children}
    </div>
  );
}