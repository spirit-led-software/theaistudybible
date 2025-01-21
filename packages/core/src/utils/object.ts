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

type TransformType = 'toKebab' | 'toCamel';

export function transformKeys(
  // biome-ignore lint/suspicious/noExplicitAny: Just accept it
  obj: Record<string, any>,
  transformType: TransformType,
) {
  const transform = (key: string): string => {
    if (transformType === 'toKebab') {
      return key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
    }

    if (transformType === 'toCamel') {
      return key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    return key;
  };

  // biome-ignore lint/suspicious/noExplicitAny: Just accept it
  const transformObject = (input: Record<string, any>): Record<string, any> => {
    return Object.entries(input).reduce(
      (acc, [key, value]) => {
        const newKey = transform(key);
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          acc[newKey] = transformObject(value); // Recursively transform nested objects
        } else {
          acc[newKey] = value;
        }
        return acc;
      },
      // biome-ignore lint/suspicious/noExplicitAny: Just accept it
      {} as Record<string, any>,
    );
  };

  return transformObject(obj);
}
