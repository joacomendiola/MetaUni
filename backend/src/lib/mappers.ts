import type { Career, Subject } from "@prisma/client";
import { progressPercent, type Career as CareerDTO, type Subject as SubjectDTO } from "@metauni/shared";

export function effectiveTotal(totalSubjects: number, subjectCount: number): number {
  return totalSubjects > 0 ? totalSubjects : subjectCount;
}

export function subjectToDTO(subject: Subject): SubjectDTO {
  return {
    id: subject.id,
    careerId: subject.careerId,
    name: subject.name,
    year: subject.year,
    term: subject.term,
    credits: subject.credits,
    status: subject.status,
    grade: subject.grade,
    notes: subject.notes,
    completedAt: subject.completedAt ? subject.completedAt.toISOString() : null,
    createdAt: subject.createdAt.toISOString(),
    updatedAt: subject.updatedAt.toISOString(),
  };
}

export function careerToDTO(career: Career & { subjects?: Subject[] }): CareerDTO {
  const subjects = career.subjects ?? [];
  const approved = subjects.filter((s) => s.status === "APROBADA").length;
  const total = effectiveTotal(career.totalSubjects, subjects.length);

  const dto: CareerDTO = {
    id: career.id,
    name: career.name,
    faculty: career.faculty,
    description: career.description,
    color: career.color,
    totalSubjects: career.totalSubjects,
    isCatalog: career.isCatalog,
    ownerId: career.ownerId,
    createdAt: career.createdAt.toISOString(),
    updatedAt: career.updatedAt.toISOString(),
  };

  if (career.subjects) {
    dto.subjects = subjects
      .slice()
      .sort((a, b) => a.year - b.year || a.name.localeCompare(b.name))
      .map(subjectToDTO);
  }
  dto.progress = { total, approved, percent: progressPercent(approved, total) };
  return dto;
}
