import { MdOutlineAssignment } from "react-icons/md";
import { FaRegCheckCircle } from "react-icons/fa";
import { ResultCard } from "@shared/ui/card";

const schema = {
  title: 'Спасибо за прохождение опроса',
  description: [
    'Ваши ответы останутся полностью анонимными.'
  ],
};

export const SurveyResult = () => {
  return (
    <ResultCard
      logoIcon={<MdOutlineAssignment size={48} />}
      successIcon={<FaRegCheckCircle size={64} color="#28A745"/>}
      schema={schema}
    />
  )
}