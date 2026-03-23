import styles from './Label.module.css'

export const Label = ({
  children,
  className='',
  ...props
}) => {
  const classes = `
    ${styles.label} 
    ${className}
  `;
  return (
    <label 
      className={classes}
      {...props}
    >
      {children}
    </label>
  )  
}