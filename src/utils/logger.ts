import Logger from 'js-logger';

const defaultLogLevel =
  import.meta.env.MODE === 'production' ? Logger.OFF : Logger.INFO;

// This is not a react hook.
// eslint-disable-next-line react-hooks/rules-of-hooks
Logger.useDefaults({
  defaultLevel: defaultLogLevel,
  formatter(messages, context) {
    if (context.name) {
      messages.unshift(`[${context.name}]`);
    }
    messages.unshift(new Date().toISOString());
  },
});

if (import.meta.env.MODE === 'development') {
  Logger.get('device').setLevel(Logger.DEBUG);
  Logger.get('ebb').setLevel(Logger.DEBUG);
  Logger.get('plotter').setLevel(Logger.INFO);
  Logger.get('virtual').setLevel(Logger.DEBUG);
}
