import Logger from 'js-logger';

const defaultLogLevel =
  process.env.NODE_ENV === 'production' ? Logger.OFF : Logger.INFO;

Logger.useDefaults({
  defaultLevel: defaultLogLevel,
});

if (process.env.NODE_ENV === 'development') {
  Logger.get('device').setLevel(Logger.INFO);
  Logger.get('ebb').setLevel(Logger.INFO);
  Logger.get('plotter').setLevel(Logger.INFO);
}
