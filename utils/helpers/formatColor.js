import { hexValues, tailwindValues } from "../../constants/colors";

export const formatColor = (color) => {
  if (!color) {
    return "#fcd34d";
  }
  const tailwindIndex = hexValues.indexOf(color);
  if (tailwindIndex === -1) {
    return "#fcd34d";
  }
  const colorToReturn = tailwindValues[tailwindIndex];
  return colorToReturn;
};

export const unFormatColor = (color) => {
  if (!color) {
    return "#fcd34d";
  }
  const hexIndex = tailwindValues.indexOf(color);
  if (hexIndex === -1) {
    return "#fcd34d";
  }
  const colorToReturn = hexValues[hexIndex];
  return colorToReturn;
};

export default formatColor;
