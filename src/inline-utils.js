function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/* eslint-disable-next-line */
function safeParse(payload) {
  try {
    var result = JSON.parse(payload);
    return isPlainObject(result) ? result : {};
  } catch (e) {
    return {};
  }
}
