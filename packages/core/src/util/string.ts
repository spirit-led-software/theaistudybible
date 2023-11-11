export function toCapitalizedCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toTitleCase(str: string) {
  return str
    .split(" ")
    .map((word) => toCapitalizedCase(word))
    .join(" ");
}
