import { useEffect, useEffectEvent } from 'react';

// what counts as the user doing something on the page
const activityEvents = ['pointerdown', 'keydown', 'wheel'] as const;

/**
 * Calls `onIdle` once the user has done nothing for `timeout` ms, counting
 * while `active`. Anything the user does starts the count again.
 */
export const useIdleTimeout = (
  active: boolean,
  timeout: number,
  onIdle: () => void,
) => {
  const fire = useEffectEvent(onIdle);
  useEffect(() => {
    if (!active) return;
    let timer = setTimeout(fire, timeout);
    const restart = () => {
      clearTimeout(timer);
      timer = setTimeout(fire, timeout);
    };
    for (const event of activityEvents) {
      document.addEventListener(event, restart, { capture: true });
    }
    return () => {
      clearTimeout(timer);
      for (const event of activityEvents) {
        document.removeEventListener(event, restart, { capture: true });
      }
    };
  }, [active, timeout]);
};
