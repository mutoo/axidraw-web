import type { SelectHTMLAttributes } from 'react';
import type { RulerChoice } from './ruler-choice';
import { RULER_OFF, rulerVariants, useRulerChoice } from './ruler-choice';

// picks the ruler every page view of the app shows, or none
const RulerSelect = (
  props: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'>,
) => {
  const [choice, setChoice] = useRulerChoice();
  return (
    <select
      value={choice}
      onChange={(e) => {
        setChoice(e.target.value as RulerChoice);
      }}
      {...props}
    >
      {rulerVariants.map(({ id, name }) => (
        <option key={id} value={id}>
          {name} ruler
        </option>
      ))}
      <option value={RULER_OFF}>No ruler</option>
    </select>
  );
};

export default RulerSelect;
