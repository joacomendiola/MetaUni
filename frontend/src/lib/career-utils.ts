export function effectiveTotal(totalSubjects: number, subjectCount: number): number {
  return totalSubjects > 0 ? totalSubjects : subjectCount;
}
