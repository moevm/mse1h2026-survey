import styles from './Toggle.module.css';

export const Toggle = ({ 
  checked, 
  onChange, 
  label, 
  id 
}) => {
  return (
    <div className={styles.container}>
      <label className={styles.switch}>
        <input 
          id={id}
          type="checkbox" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
        />
        <span className={styles.slider}></span>
      </label>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
    </div>
  );
};