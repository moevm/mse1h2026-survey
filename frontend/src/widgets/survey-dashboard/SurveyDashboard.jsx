import { Button } from '@/shared/ui/button';
import { SurveyCard } from '@shared/ui/card';
import { EmptyCard } from '@shared/ui/card';
import styles from './SurveyDashboard.module.css';

export const SurveyDashboard = ({ 
  surveys, 
  onCreate,
  onDelete,
  onEdit,
  onToggle
}) => {
  const isEmpty = surveys.length === 0;

  return (
    <section className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>Управление опросами</h1>
          <p className={styles.pageSubtitle}>
            Создавайте, редактируйте и управляйте вашими опросами
          </p>
        </div>
        <Button className={styles.createBtn} onClick={onCreate}>
          + Создать опрос
        </Button>
      </div>

      <div className={styles.grid}>
        {isEmpty ? (
          <EmptyCard onClick={onCreate} />
        ) : (
          surveys.map((survey) => (
            <SurveyCard 
              key={survey.id} 
              data={survey}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))
        )}
      </div>
    </section>
  );
};