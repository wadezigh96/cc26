export function canonicalJson(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}
