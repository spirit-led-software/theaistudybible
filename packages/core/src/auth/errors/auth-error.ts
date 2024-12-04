export type AuthErrorType =
  | 'DifferentProvider'
  | 'InvalidSignIn'
  | 'EmailExists'
  | 'InvalidSession'
  | 'UserNotFound'
  | 'InvalidResetCode'
  | 'ReusedPassword';

export class AuthError extends Error {
  type: AuthErrorType;

  constructor(type: AuthErrorType, message?: string) {
    super(message);
    this.type = type;
    this.name = this.constructor.name;
  }
}
