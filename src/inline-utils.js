export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/* eslint-disable-next-line */
export function safeParse(payload) {
  try {
    const result = JSON.parse(payload);
    return isPlainObject(result) ? result : {};
  } catch (e) {
    return {};
  }
}
