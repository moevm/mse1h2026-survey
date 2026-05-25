import { useState } from 'react';
import { Card } from '@shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

import { FiEdit2 } from "react-icons/fi";
import { FiPower } from "react-icons/fi";
import { FiCopy } from "react-icons/fi";
import { FiClipboard } from "react-icons/fi";
import { FiDownload } from "react-icons/fi";
import { FiChevronDown } from "react-icons/fi";
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
  onToggle,
  onClone,
  onExport
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isIdCopied, setIsIdCopied] = useState(false)

  const { 
    id, 
    title, 
    description, 
    questions, 
    is_active 
  } = data;
  const answersCount = data.answers_count ?? data.answersCount ?? data.responses_count ?? data.response_count ?? 0

  const currentStatus = is_active 
    ? statusConfig['active'] 
    : statusConfig['closed']

  const surveyLink = `${window.location.origin}/survey/${id}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(surveyLink)
    } catch {
      const input = document.createElement('input')
      input.value = surveyLink
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
  }

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(String(id))
    } catch {
      const input = document.createElement('input')
      input.value = String(id)
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }

    setIsIdCopied(true)
    window.setTimeout(() => setIsIdCopied(false), 1600)
  }

  const handleExport = (format) => {
    onExport(id, format)
    setIsExportOpen(false)
  }
  
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
          <span className={styles.countLabel}>ID:</span>
          <button
            type="button"
            className={styles.idSpoiler}
            onClick={handleCopyId}
            title="Скопировать ID опроса"
          >
            {isIdCopied ? 'ID скопирован' : 'Скопировать ID'}
          </button>
          <span className={styles.countDivider}>/</span>
          <span className={styles.countLabel}>Вопросов:</span>
          <span className={styles.countValue}>{questions?.length || 0}</span>
          <span className={styles.countDivider}>/</span>
          <span className={styles.countLabel}>Ответов:</span>
          <span className={styles.countValue}>{answersCount}</span>
        </div>

        <div className={styles.actions}>
          <div className={styles.actionGroup} aria-label="Управление опросом">
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

          <div className={styles.actionGroup} aria-label="Копирование">
            <Button
              className={clsx(styles.iconBtn, styles.cloneBtn)}
              onClick={() => onClone(id)}
              title="Клонировать опрос"
            >
              <FiClipboard className={styles.icon} />
            </Button>

            <Button
              className={clsx(styles.iconBtn, styles.copyBtn)}
              onClick={handleCopyLink}
              title="Скопировать ссылку на опрос"
            >
              <FiCopy className={styles.icon} />
            </Button>
          </div>

          <div className={styles.statsGroup} aria-label="Статистика">
            <div className={styles.exportWrapper}>
              <Button
                className={clsx(styles.exportBtn, styles.exportMainBtn)}
                onClick={() => handleExport('pdf')}
                title="Выгрузить статистику"
              >
                <FiDownload className={styles.icon} />
                Выгрузить
              </Button>
              <Button
                className={clsx(styles.exportBtn, styles.exportArrowBtn)}
                onClick={() => setIsExportOpen((prev) => !prev)}
                title="Выбрать формат выгрузки"
              >
                <FiChevronDown className={styles.icon} />
              </Button>

              {isExportOpen && (
                <div className={styles.exportMenu}>
                  <button type="button" onClick={() => handleExport('pdf')}>
                    PDF
                  </button>
                  <button type="button" onClick={() => handleExport('excel')}>
                    Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
