import { RadioQuestion } from "./radio/RadioQuestion";
import { TextQuestion } from "./text/TextQuestion";
import { ScaleQuestion } from "./scale/ScaleQuestion";
import { CheckboxQuestion } from "./checkbox/CheckboxQuestion";

const questionMap = {
  radio: RadioQuestion,
  checkbox: CheckboxQuestion,
  scale: ScaleQuestion,
  text: TextQuestion
}

export const Question = ({
  type,
  ...props
}) => {
  const Component = questionMap[type];
  if (!Component) {
    return null
  }
  return <Component {...props} />
}
