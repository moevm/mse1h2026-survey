export const validateGroupCode = (value) => {
  if (!value.trim()) return 'Введите код группы';
  if (value.length !== 4) return 'Код должен быть ровно 4 символа';
  if (!/^\d+$/.test(value.trim())) return 'Код должен содержать только цифры';
  return null;
};