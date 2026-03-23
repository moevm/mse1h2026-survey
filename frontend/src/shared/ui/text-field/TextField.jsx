import { Input } from '../input';
import { Label } from '../label';
import styles from './TextField.module.css';

export const TextField = ({ 
  id,
  label, 
  error,
  className = '',
  isHiddenLabel = false,
  ...props 
}) => {
  const isInvalid = !!error;
  const isDisabled = props.disabled;

  return (
    <div 
      className={`${styles.field} ${className}`} 
      data-invalid={isInvalid}
      data-disabled={isDisabled}
    >
      {label && (
        <Label 
          htmlFor={id} 
          className={styles.labelFloating}
          data-visually-hidden={isHiddenLabel}
        >
          {label}
        </Label>
      )}
      <Input 
        id={id} 
        isError={isInvalid}
        disabled={isDisabled}
        {...props} 
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  )
};