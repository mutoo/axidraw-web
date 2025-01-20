import { Timer } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatTime } from '@/utils/time';
import { PlotterContext } from '../../context';

const Estimating = observer(() => {
  const { work, planning } = useContext(PlotterContext);
  const [time, setTime] = useState<number>(
    planning.motions ? work.estimate({ motions: planning.motions }) : 0,
  );
  const timer = useRef<NodeJS.Timeout>();
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setTime(
        planning.motions ? work.estimate({ motions: planning.motions }) : 0,
      );
    }, 100);
    return () => {
      clearTimeout(timer.current);
    };
  });
  if (!time) return null;
  return (
    <section className="grid grid-cols-1 gap-4">
      <Alert variant="default">
        <Timer className="h-4 w-4" />
        <AlertTitle>Time</AlertTitle>
        <AlertDescription>
          Estimated plotting time: {formatTime(time / 1000)}
        </AlertDescription>
      </Alert>
    </section>
  );
});

export default Estimating;
