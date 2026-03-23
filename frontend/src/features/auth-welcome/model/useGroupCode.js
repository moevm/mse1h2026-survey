import { useState } from "react";
import { validateGroupCode } from "./validateGroupCode";

export const useGroupCode = ({ onSubmit }) => {
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

  return { 
    groupCode, 
    error, 
    handleChange, 
    handleSubmit 
  };
}