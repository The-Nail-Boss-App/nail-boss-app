export const polishWorkflowSignature = (polish = {}) => [
  polish.colorHex?.toUpperCase(),
  polish.polishType || polish.finish,
  polish.shine,
  polish.transparency,
  polish.sparkleDensity,
  polish.sparkleSize,
  polish.chromeIntensity,
  polish.catEyeIntensity,
  polish.name,
].join("|");

export function addProjectPolish(palette, polish) {
  const signature = polishWorkflowSignature(polish);
  return palette.some((item) => polishWorkflowSignature(item) === signature)
    ? palette
    : [...palette, polish];
}

export function touchRecentPolish(recent, polish, limit = 12) {
  const signature = polishWorkflowSignature(polish);
  return [polish, ...recent.filter((item) => polishWorkflowSignature(item) !== signature)].slice(0, limit);
}
