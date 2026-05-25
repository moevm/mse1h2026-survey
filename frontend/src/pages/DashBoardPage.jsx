import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@shared/ui/container';
import { Header } from '@widgets/header';
import { Main } from '@widgets/main';
import { Footer } from '@widgets/footer';
import { SurveyDashboard } from '@widgets/survey-dashboard';
import { api, request } from '@shared/api/axios';
import LogoIcon from '@shared/assets/icons/logo.svg?react';

export const DashBoardPage = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getSurveyAnswerCount = async (id) => {
    try {
      const stats = await request('GET', `/survey/answers/${id}`);
      return stats.count ?? stats.answers_list?.length ?? 0;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    const loadSurveys = async () => {
      try {
        const response = await request('GET', '/survey');
        const surveyList = response.survey_list ?? [];
        const surveysWithStats = await Promise.all(
          surveyList.map(async (survey) => ({
            ...survey,
            answers_count: await getSurveyAnswerCount(survey.id)
          }))
        );
        setSurveys(surveysWithStats);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSurveys();
  }, []);

  const handleRemove = async (id) => {
    try {
      await request('DELETE', `/survey/${id}`);
      setSurveys((prevSurveys) => prevSurveys.filter((survey) => survey.id !== id));
    } catch (err) {
      setError(err);
    }
  };

  const handleEdit = (id) => {
    navigate(`/builder/${id}`);
  };

  const cloneQuestions = (questions = []) => (
    questions.map((question) => ({
      ...question,
      id: crypto.randomUUID(),
      options: question.type === 'blueprint' && Array.isArray(question.options)
        ? cloneQuestions(question.options)
        : Array.isArray(question.options)
          ? [...question.options]
          : question.options && typeof question.options === 'object'
            ? { ...question.options }
            : question.options
    }))
  );

  const handleClone = async (id) => {
    const targetSurvey = surveys.find((survey) => survey.id === id);
    if (!targetSurvey) return;

    const clonedSurvey = {
      ...targetSurvey,
      id: crypto.randomUUID(),
      title: `${targetSurvey.title} Copy`,
      questions: cloneQuestions(targetSurvey.questions)
    };

    try {
      const formData = new FormData();
      formData.append('title', clonedSurvey.title);
      formData.append('description', clonedSurvey.description ?? '');
      formData.append('is_active', clonedSurvey.is_active ?? false);
      formData.append('questions', JSON.stringify(clonedSurvey.questions ?? []));
      formData.append('groups', JSON.stringify(clonedSurvey.groups ?? ['3341']));

      const createdSurvey = await request('POST', '/survey', formData);
      setSurveys((prevSurveys) => [...prevSurveys, { ...createdSurvey, answers_count: 0 }]);
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };

  const handleCreate = () => {
    navigate('/builder');
  };

  const saveBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getExportFilename = (contentDisposition, defaultFilename) => {
    const utfName = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    if (utfName) {
      return decodeURIComponent(utfName);
    }

    const plainName = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
    return plainName || defaultFilename;
  };

  const handleExport = async (id, format) => {
    const targetSurvey = surveys.find((survey) => survey.id === id);
    if (!targetSurvey) return;

    const extension = format === 'excel' ? 'xlsx' : 'pdf';
    const safeTitle = String(targetSurvey.title ?? 'survey')
      .replace(/[\\/:*?"<>|]/g, '_');

    try {
      const response = await api.get(`/survey/${id}/export/${format}`, {
        responseType: 'blob'
      });
      const filename = getExportFilename(
        response.headers['content-disposition'],
        `${safeTitle}-stats.${extension}`
      );

      saveBlob(response.data, filename);
    } catch (err) {
      const message = err.response?.data instanceof Blob
        ? await err.response.data.text()
        : 'Не удалось выгрузить статистику';
      console.error(message);
      setError('Не удалось выгрузить статистику');
    }
  };

  const handleToggle = async (id) => {
    try {
      const targetSurvey = surveys.find((survey) => survey.id === id);
      if (!targetSurvey) return;

      await request('PUT', `/survey/${id}`, {
        is_active: !targetSurvey.is_active
      });
      setSurveys((prevSurveys) => (
        prevSurveys.map((survey) => (
          survey.id === id
            ? { ...survey, is_active: !survey.is_active }
            : survey
        ))
      ));
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };

  if (isLoading) {
    return null;
  }

  if (error) {
    return <div>{String(error)}</div>;
  }

  return (
    <>
      <Header>
        <Container>
          <LogoIcon />
        </Container>
      </Header>
      <Main>
        <Container>
          <SurveyDashboard
            surveys={surveys}
            onCreate={handleCreate}
            onDelete={handleRemove}
            onEdit={handleEdit}
            onToggle={handleToggle}
            onClone={handleClone}
            onExport={handleExport}
          />
        </Container>
      </Main>
      <Footer />
    </>
  );
};
