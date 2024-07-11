const formatColor = (color) => {
  if (!color) {
    return "#fcd34d";
  }
  const plainColor = color.split("-")[1];
  switch (plainColor) {
    case "amber":
      return "#fcd34d";
    case "emerald":
      return "#6ee7b7";
    case "rose":
      return "#fda4af";
    case "sky":
      return "#7dd3fc";
    case "indigo":
      return "#a5b4fc";
    default:
      return plainColor;
  }
};

export default formatColor;
