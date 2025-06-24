export const hexToRgb = (hex: string): string | null => {
  if (!hex || hex.length < 4 || hex.length > 7 || hex[0] !== "#") {
    return null;
  }
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return null;
  }
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `${r}, ${g}, ${b}`;
};
