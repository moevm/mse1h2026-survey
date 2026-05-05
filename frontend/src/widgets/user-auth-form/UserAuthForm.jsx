import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextField } from '@shared/ui/text-field';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import styles from './UserAuthForm.module.css';

export const UserAuthForm = ({ mode = 'login', onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirm_password: ''
  });

  const isLogin = mode === 'login';
  const passwordError = !isLogin && formData.confirm_password && formData.password !== formData.confirm_password
    ? 'Пароли не совпадают'
    : '';

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwordError) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <div className={styles.wrapper}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 className={styles.title}>
            {isLogin ? 'Вход в систему' : 'Регистрация'}
          </h2>

          <div className={styles.fields}>
            <TextField
              id="username"
              type="text"
              label="username"
              placeholder="admin"
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
              required
            />

            <TextField
              id="password"
              type="password"
              label="Пароль"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              required
            />

            {!isLogin && (
              <TextField
                id="confirm_password"
                type="password"
                label="Подтверждение пароля"
                placeholder="••••••••"
                value={formData.confirm_password}
                onChange={handleChange}
                disabled={isLoading}
                error={passwordError}
                required
              />
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || (!!passwordError && !isLogin)}
          >
            {isLoading ? 'Отправка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
          </Button>
        </form>

        <div className={styles.footer}>
          {isLogin ? (
            <span>
              Нет аккаунта? <Link to="/register" className={styles.link}>Зарегистрироваться</Link>
            </span>
          ) : (
            <span>
              Уже есть аккаунт? <Link to="/login" className={styles.link}>Войти</Link>
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
