import ReactGA from 'react-ga4';

if (import.meta.env.VITE_GA) {
  ReactGA.initialize(import.meta.env.VITE_GA, {
    testMode: import.meta.env.MODE === 'development',
  });
}

export const trackCategoryEvent =
  (category: string) => (action: string, label?: string) => {
    if (import.meta.env.VITE_GA) {
      ReactGA.event({
        category,
        action,
        label,
      });
    } else {
      console.log(`track event: ${category} ${action} ${label}`);
    }
  };
