/**
 * Project categories understood by the trained Random Forest model.
 * Legacy production values are preserved by the edit form but are not offered
 * for new projects because the encoder was not trained on them.
 */
export const MODEL_PROJECT_TYPES = [
  'Highway',
  'Railway',
  'Irrigation',
  'Power',
] as const;

export type ModelProjectType = (typeof MODEL_PROJECT_TYPES)[number];

export const formatProjectType = (value: string | null | undefined): string => {
  const normalized = value?.trim();
  return normalized ? normalized : 'Unknown';
};

export const getProjectTypeOptions = (
  currentProjectType?: string | null
): string[] => {
  const current = currentProjectType?.trim();
  if (
    current &&
    !MODEL_PROJECT_TYPES.includes(current as ModelProjectType)
  ) {
    return [...MODEL_PROJECT_TYPES, current];
  }
  return [...MODEL_PROJECT_TYPES];
};
