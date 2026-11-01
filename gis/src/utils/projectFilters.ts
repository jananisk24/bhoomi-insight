import type { Project } from '../types';

export const getProjectStates = (projects: Project[]): string[] =>
  [...new Set(projects.map((project) => project.state.trim()).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right)
  );

export const getProjectDistricts = (
  projects: Project[],
  selectedState: string
): string[] =>
  [
    ...new Set(
      projects
        .filter(
          (project) =>
            selectedState === 'All States' || project.state === selectedState
        )
        .map((project) => project.district.trim())
        .filter(Boolean)
    ),
  ].sort((left, right) => left.localeCompare(right));

export const filterProjectsByJurisdiction = (
  projects: Project[],
  selectedState: string,
  selectedDistrict: string
): Project[] =>
  projects.filter(
    (project) =>
      (selectedState === 'All States' || project.state === selectedState) &&
      (selectedDistrict === 'All Districts' ||
        project.district === selectedDistrict)
  );
