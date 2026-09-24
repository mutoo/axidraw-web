export const ENDING_CR = '\r';
export const ENDING_CR_NL = '\r\n';
export const ENDING_NL_CR = '\n\r';
export const ENDING_OK_CR_NL = 'OK\r\n';

export const EXECUTION_IMMEDIATE = 0;
export const EXECUTION_FIFO = 1;

// The slowest an axis may step during an SM move. EBB firmware v2.x rejects
// an SM when duration / 1311 >= steps, i.e. slower than one step per 1.31 s,
// which its docs describe as "1.31 steps/second".
export const SM_MAX_MS_PER_STEP = 1310;

export const HIGH_DPI_AA = 2870;
export const HIGH_DPI_XY = 2029; // HIGH_DPI_AA / Sqrt(2)
