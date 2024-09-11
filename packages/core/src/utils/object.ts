export function getPropertyName<T extends object>(
  object: T,
  expression: (x: { [Property in keyof T]: string }) => string,
) {
  const res = {} as { [Property in keyof T]: string };
  for (const k of Object.keys(object)) {
    res[k as keyof T] = k;
  }
  return expression(res);
}
