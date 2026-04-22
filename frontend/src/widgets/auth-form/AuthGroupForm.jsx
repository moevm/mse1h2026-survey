import { useState } from 'react'
import { MdOutlineAssignment } from "react-icons/md";
import { Card } from '@shared/ui/card'
import { TextField } from '@shared/ui/text-field'
import { Button } from '@shared/ui/button'
import styles from './AuthGroupForm.module.css'

const schema = {
  title: 'Анонимный опрос',
  description: [
    'Введите код вашей группы, чтобы начать прохождение опроса.',
    'Ваши ответы останутся полностью анонимными.'
  ],
  groupId: 'group-code-input',
  groupLabel: 'Группа',
  groupPlaceHolder: 'Например, 3341',
  submitText: 'Начать опрос'
}

export const AuthGroupForm = ({ onSubmit }) => {
  const [groupCode, setGroupCode] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setGroupCode(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = validateGroupCode(groupCode);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSubmit(groupCode);
  };

  const validateGroupCode = (value) => {
    if (!value.trim()) return 'Введите код группы';
    if (value.length !== 4) return 'Код должен быть ровно 4 символа';
    if (!/^\d+$/.test(value.trim())) return 'Код должен содержать только цифры';
    return null;
  };  
  
  return (
    <Card as='form' className={styles.card} onSubmit={handleSubmit}>
      <MdOutlineAssignment size={48}/>
      <h2 className={styles.title}>{schema.title}</h2>
      <div className={styles.description}>
        {schema.description.map((text, idx) => (
          <p key={idx} className={styles.text}>{text}</p>
        ))}
      </div>
      <TextField
        id={schema.groupId}
        label={schema.groupLabel}
        isHiddenLabel
        placeholder={schema.groupPlaceHolder}
        value={groupCode}
        onChange={handleChange}
        error={error}
      />
      <Button 
        type="submit"
        className={styles.button}
      >
        {schema.submitText}
      </Button>
    </Card>
  );
}