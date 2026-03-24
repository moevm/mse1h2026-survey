import { Input } from "../input";
import { Label } from "../label";
import { RadioDot } from "./RadioDot";
import styles from './RadioItem.module.css'

export const RadioItem = ({ 
  label, 
  id, 
  checked,
  disabled,
  isInvalid,
  onChange, 
  className = '' 
}) => {
  return (
    <Label 
      className={`${styles.item} ${className}`} 
      data-checked={checked}
      data-invalid={isInvalid} 
    >
      <Input
        type="radio"
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        data-visually-hidden 
      />

      <RadioDot />

      <span className={styles.label}>
        {label}
      </span>
    </Label>
  );
};