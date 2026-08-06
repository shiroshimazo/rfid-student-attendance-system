export type LoginFormState = {
  message: string;
  captchaRequired: boolean;
};

export const initialLoginFormState: LoginFormState = {
  message: "",
  captchaRequired: false,
};
