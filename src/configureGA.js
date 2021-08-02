import ReactGA from 'react-ga';

if (process.env.GA) {
  ReactGA.initialize(process.env.GA, {
    debug: false, // please use Google Analytics Debugger extension instead
  });
  ReactGA.pageview(window.location.pathname + window.location.search);
}

// eslint-disable-next-line import/prefer-default-export
export const trackCategoryEvent =
  (category) =>
  (action, label = undefined) => {
    if (process.env.GA) {
      ReactGA.event({
        category,
        action,
        label,
      });
    }
  };
