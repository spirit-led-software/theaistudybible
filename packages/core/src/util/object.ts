export function getPropertyName<T extends object>(
  o: T,
  expression: (x: { [Property in keyof T]: string }) => string
) {
  const res = {} as { [Property in keyof T]: string };
  Object.keys(o).map((k) => (res[k as keyof T] = k));
  return expression(res);
}
