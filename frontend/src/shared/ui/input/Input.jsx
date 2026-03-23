import style from './Input.module.css'

export const Input = ({
  className = '',
  isError = false,
  disabled,
  ...props
}) => {

  return (
    <input
      className={`${style.input} ${className}`}
      aria-invalid={isError}
      disabled={disabled}
      {...props}
    />
  );
};