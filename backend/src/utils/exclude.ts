/**
 * Exclude keys from object
 * @param obj
 * @param keys
 * @returns object without excluded keys
 */
const exclude = <Type, Key extends keyof Type>(obj: Type, keys: Key[]): Omit<Type, Key> => {
  for (const key of keys) {
    delete obj[key];
  }
  return obj;
};

export default exclude;
