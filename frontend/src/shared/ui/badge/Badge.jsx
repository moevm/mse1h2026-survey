import clsx from 'clsx'
import styles from './Badge.module.css';

const mapVariantClass = {
  active: styles.active,   
  closed: styles.closed,   
  pending: styles.pending,
};

export const Badge = ({ 
  children, 
  variant = 'active' 
}) => {
  return (
    <span className={clsx(styles.badge, mapVariantClass[variant])}>
      {children}
    </span>
  );
};