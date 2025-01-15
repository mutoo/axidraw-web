export const trackCategoryEvent =
  (category: string) => (action: string, label?: string) => {
    console.log('track', category, action, label);
  };
