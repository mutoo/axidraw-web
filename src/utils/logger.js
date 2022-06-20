import Logger from 'js-logger';

const defaultLogLevel =
  process.env.NODE_ENV === 'production' ? Logger.OFF : Logger.INFO;

Logger.useDefaults({
  defaultLevel: defaultLogLevel,
  formatter(messages, context) {
    if (context.name) {
      messages.unshift(`[${context.name}]`);
    }
    messages.unshift(`${+new Date()}`);
  },
});

if (process.env.NODE_ENV === 'development') {
  Logger.get('device').setLevel(Logger.INFO);
  Logger.get('ebb').setLevel(Logger.INFO);
  Logger.get('plotter').setLevel(Logger.INFO);
  Logger.get('virtual').setLevel(Logger.INFO);
}
