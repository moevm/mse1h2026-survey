import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@shared/ui/container'; // подправь пути под свои алиасы, если нужно
import { Card } from '@shared/ui/card';
import { Button } from '@shared/ui/button';

export function NotFoundPage({ message = "Запрашиваемый опрос не найден или больше не существует." }) {
  const navigate = useNavigate();

  return (
    <Container>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh' 
      }}>
        <Card style={{ padding: '40px', textAlign: 'center', maxWidth: '500px' }}>
          <h1 style={{ fontSize: '48px', margin: '0 0 16px 0', color: 'var(--text-error, #ff4d4f)' }}>
            Упс!
          </h1>
          <p style={{ fontSize: '18px', marginBottom: '32px', color: 'var(--text-secondary, #555)' }}>
            {message}
          </p>
          <Button onClick={() => navigate('/login')}>
            Вернуться на главную
          </Button>
        </Card>
      </div>
    </Container>
  );
}