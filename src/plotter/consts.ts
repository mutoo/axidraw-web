export const PLOTTER_STATUS_STANDBY = 'axidraw-web-plotter-status-standby';
export const PLOTTER_STATUS_PAUSED = 'axidraw-web-plotter-status-paused';
export const PLOTTER_STATUS_PLOTTING = 'axidraw-web-plotter-status-plotting';

export enum PLOTTER_ACTION {
  PAUSE,
  RESUME,
  STOP,
}

export enum PLOTTER_SPEED_MODE {
  CONSTANT,
  ACCELERATING,
}

export const MOTION_PEN_UP = 1;
export const MOTION_PEN_DOWN = 0;
