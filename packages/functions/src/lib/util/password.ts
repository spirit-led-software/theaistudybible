import isStrongPassword from 'validator/lib/isStrongPassword';

export function verifyPassword(password: string) {
  return isStrongPassword(password, {
    minLength: 8,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  });
}
