interface ProjectOrderingFields {
  id: string | number;
  createdDate?: string | null;
}

const numericId = (value: string | number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
};

/** Newest project first, with ID as a deterministic tie-breaker. */
export const sortProjectsNewestFirst = <T extends ProjectOrderingFields>(
  projects: T[]
): T[] =>
  [...projects].sort((left, right) => {
    const leftTime = left.createdDate
      ? Date.parse(left.createdDate)
      : Number.NaN;
    const rightTime = right.createdDate
      ? Date.parse(right.createdDate)
      : Number.NaN;

    if (
      Number.isFinite(leftTime) &&
      Number.isFinite(rightTime) &&
      leftTime !== rightTime
    ) {
      return rightTime - leftTime;
    }

    return numericId(right.id) - numericId(left.id);
  });
