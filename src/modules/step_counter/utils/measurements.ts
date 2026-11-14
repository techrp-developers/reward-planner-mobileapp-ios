// Height and weight options shared by StepForm and My Plan.
//
// Heights are real feet + inches (5' 8" = 68 in = 173 cm). The old list used
// decimal feet ("5.8 ft" = 176.8 cm), which most people read as 5' 8".

export type MeasurementOption = { label: string; value: number };

const IN_TO_CM = 2.54;

export const HEIGHT_OPTIONS: MeasurementOption[] = Array.from({ length: 31 }, (_, i) => {
  const inches = 54 + i; // 4' 6" … 7' 0"
  return {
    label: `${Math.floor(inches / 12)}' ${inches % 12}"`,
    value: Math.round(inches * IN_TO_CM),
  };
});

export const WEIGHT_OPTIONS: MeasurementOption[] = Array.from({ length: 121 }, (_, i) => ({
  label: `${30 + i} kg`,
  value: 30 + i,
}));

export const DEFAULT_HEIGHT_CM = HEIGHT_OPTIONS.find(o => o.label === `5' 6"`)!.value;
export const DEFAULT_WEIGHT_KG = 60;

/** Closest option, so a saved value (e.g. 170 cm) preselects a sensible row. */
export const nearestOption = (options: MeasurementOption[], value: number | null | undefined) => {
  const target = Number(value);
  if (!Number.isFinite(target) || target <= 0) return null;
  return options.reduce((best, o) => (Math.abs(o.value - target) < Math.abs(best.value - target) ? o : best));
};

export const optionLabel = (options: MeasurementOption[], value: number) =>
  options.find(o => o.value === value)?.label ?? String(value);

/** Same formula as the server (kg / m²); used only for the live preview. */
export const bmiFrom = (heightCm: number, weightKg: number) => {
  if (!(heightCm > 0) || !(weightKg > 0)) return 0;
  const m = heightCm / 100;
  return weightKg / (m * m);
};
