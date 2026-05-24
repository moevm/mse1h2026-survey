import { useMemo, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { SurveyCard } from '@shared/ui/card';
import { EmptyCard } from '@shared/ui/card';
import styles from './SurveyDashboard.module.css';

export const SurveyDashboard = ({ 
  surveys, 
  onCreate,
  onDelete,
  onEdit,
  onToggle,
  onClone,
  onExport
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredSurveys = useMemo(() => {
    if (!normalizedSearchQuery) {
      return surveys;
    }

    return surveys.filter((survey) => (
      String(survey.title ?? '').toLowerCase().includes(normalizedSearchQuery)
    ));
  }, [surveys, normalizedSearchQuery]);

  const isEmpty = surveys.length === 0;
  const isSearchEmpty = !isEmpty && filteredSurveys.length === 0;

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

      {!isEmpty && (
        <div className={styles.searchBlock}>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className={styles.searchInput}
            placeholder="Поиск по названию опроса"
            aria-label="Поиск по названию опроса"
          />
        </div>
      )}

      <div className={styles.grid}>
        {isEmpty ? (
          <EmptyCard onClick={onCreate} />
        ) : isSearchEmpty ? (
          <div className={styles.emptySearch}>
            Опросы с таким названием не найдены
          </div>
        ) : (
          filteredSurveys.map((survey) => (
            <SurveyCard 
              key={survey.id} 
              data={survey}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
              onClone={onClone}
              onExport={onExport}
            />
          ))
        )}
      </div>
    </section>
  );
};
