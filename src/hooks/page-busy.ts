import { useEffect } from 'react';

// what each mounted component is busy with, e.g. a plot in progress
const busyReasons = new Map<object, string>();

/**
 * Marks the page busy with `reason` for as long as it is given, so that
 * leaving the page asks first. Pass null when there is nothing to lose.
 */
export const usePageBusy = (reason: string | null) => {
  useEffect(() => {
    if (!reason) return;
    const key = {};
    busyReasons.set(key, reason);
    return () => {
      busyReasons.delete(key);
    };
  }, [reason]);
};

export const getPageBusyReasons = () => [...busyReasons.values()];
