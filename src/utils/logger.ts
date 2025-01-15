import Logger from 'js-logger';

const defaultLogLevel =
  import.meta.env.NODE_ENV === 'production' ? Logger.OFF : Logger.INFO;

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

if (import.meta.env.NODE_ENV === 'development') {
  Logger.get('device').setLevel(Logger.INFO);
  Logger.get('ebb').setLevel(Logger.INFO);
  Logger.get('plotter').setLevel(Logger.INFO);
  Logger.get('virtual').setLevel(Logger.INFO);
}
