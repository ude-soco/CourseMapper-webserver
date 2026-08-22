export function useToCamelCase(str:string) {
  return str.replace(/\b\w/g, function(word) {
    return word.toUpperCase();
  }).replace(/\b[A-Z]/g, function(word) {
    return ' ' + word;
  }).trim();
}
