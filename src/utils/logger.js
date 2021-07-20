import Logger from 'js-logger';

const defaultLogLevel =
  process.env.NODE_ENV === 'production' ? Logger.OFF : Logger.INFO;

Logger.useDefaults({
  defaultLevel: defaultLogLevel,
});

Logger.get('device').setLevel(defaultLogLevel);
Logger.get('ebb').setLevel(defaultLogLevel);
Logger.get('plotter').setLevel(defaultLogLevel);
