import { Card } from '@shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

import { FiEdit2 } from "react-icons/fi";
import { FiPower } from "react-icons/fi";
import { FiTrash2 } from "react-icons/fi";

import clsx from "clsx";
import styles from "./SurveyCard.module.css";

const statusConfig = {
  active: { label: 'Активен', variant: 'active' },
  closed: { label: 'Закрыт', variant: 'closed' },
};

export const SurveyCard = ({ 
  data, 
  onEdit, 
  onDelete, 
  onToggle 
}) => {
  const { 
    id, 
    title, 
    description, 
    questions, 
    is_active 
  } = data;

  const currentStatus = is_active 
    ? statusConfig['active'] 
    : statusConfig['closed']
  
  return (
    <Card className={styles.surveyCard}>
      <div className={styles.header}>
        <div className={styles.info}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
        </div>
        <Badge variant={currentStatus.variant}>
          {currentStatus.label}
        </Badge>
      </div>

      <div className={styles.footer}>
        <div className={styles.stats}>
          <span className={styles.countLabel}>Вопросов:</span>
          <span className={styles.countValue}>{questions?.length || 0}</span>
        </div>

        <div className={styles.actions}>          
          <Button 
            className={clsx(styles.iconBtn, styles.editBtn)} 
            onClick={() => onEdit(id)}
            title="Редактировать"
          >
            <FiEdit2 className={styles.icon} />
          </Button>

          <Button 
            className={clsx(styles.iconBtn, styles.turnBtn)} 
            onClick={() => onToggle(id)}
            title="Изменить статус"
          >
            <FiPower className={styles.icon} />
          </Button>
          
          <Button 
            className={clsx(styles.iconBtn, styles.deleteBtn)} 
            onClick={() => onDelete(id)}
            title="Удалить"
          >
            <FiTrash2 className={styles.icon} />
          </Button>
        </div>
      </div>
    </Card>
  );
};