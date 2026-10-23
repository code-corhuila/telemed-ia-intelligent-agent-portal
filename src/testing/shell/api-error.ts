/** Same shape as `shell/apiError`. */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  details: ReadonlyArray<{ field: string; message: string }>;
  traceId: string;
  userMessage: string;
}
