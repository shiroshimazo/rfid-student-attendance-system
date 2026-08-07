export type RecoveryRequestState = {
  status: "idle" | "sent" | "error";
  message: string;
  captchaRequired: boolean;
  retryAfterSeconds: number;
  submissionId: string | null;
};

export type RecoveryVerificationState = {
  status: "idle" | "verified" | "error";
  message: string;
  captchaRequired: boolean;
  retryAfterSeconds: number;
  submissionId: string | null;
};

export type RecoveryPasswordState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialRecoveryRequestState: RecoveryRequestState = {
  status: "idle",
  message: "",
  captchaRequired: false,
  retryAfterSeconds: 0,
  submissionId: null,
};

export const initialRecoveryVerificationState: RecoveryVerificationState = {
  status: "idle",
  message: "",
  captchaRequired: false,
  retryAfterSeconds: 0,
  submissionId: null,
};

export const initialRecoveryPasswordState: RecoveryPasswordState = {
  status: "idle",
  message: "",
};
