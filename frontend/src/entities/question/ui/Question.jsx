import { RadioQuestion } from "./radio/RadioQuestion";
import { TextQuestion } from "./text/TextQuestion";
import { ScaleQuestion } from "./scale/ScaleQuestion";

const questionMap = {
  radio: RadioQuestion,
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