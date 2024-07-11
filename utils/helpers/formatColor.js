const formatColor = color => {
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

const tailwindColors = {
 "bg-red-300": "#fca5a5",
 "bg-red-600": "#dc2626",
 "bg-orange-300": "#fdba74",
 "bg-orange-600": "#ea580c",
 "bg-amber-300": "#fcd34d",
 "bg-amber-600": "#d97706",
 "bg-yellow-300": "#fde047",
 "bg-yellow-600": "#ca8a04",
 "bg-lime-300": "#bef264",
 "bg-lime-600": "#65a30d",
 "bg-green-300": "#86efac",
 "bg-green-600": "#16a34a",
 "bg-emerald-300": "#6ee7b7",
 "bg-emerald-600": "#059669",
 "bg-teal-300": "#5eead4",
 "bg-teal-600": "#0d9488",
 "bg-cyan-300": "#67e8f9",
 "bg-cyan-600": "#0891b2",
 "bg-sky-300": "#7dd3fc",
 "bg-sky-600": "#0284c7",
 "bg-blue-300": "#93c5fd",
 "bg-blue-600": "#2563eb",
 "bg-indigo-300": "#a5b4fc",
 "bg-indigo-600": "#4f46e5",
 "bg-violet-300": "#c4b5fd",
 "bg-violet-600": "#7c3aed",
 "bg-purple-300": "#d8b4fe",
 "bg-purple-600": "#9333ea",
 "bg-fuchsia-300": "#f0abfc",
 "bg-fuchsia-600": "#c026d3",
 "bg-pink-300": "#f9a8d4",
 "bg-pink-600": "#db2777",
 "bg-rose-300": "#fda4af",
 "bg-rose-600": "#e11d48",
 "bg-neutral-300": "#d4d4d4",
 "bg-neutral-600": "#525252",
 "bg-stone-300": "#d6d3d1",
 "bg-stone-600": "#78716c",
 "bg-gray-300": "#e5e7eb",
 "bg-gray-600": "#4b5563",
 "bg-zinc-300": "#e4e4e7",
 "bg-zinc-600": "#52525b",
 "bg-slate-300": "#cbd5e1",
 "bg-slate-600": "#475569"
};

export default formatColor;
