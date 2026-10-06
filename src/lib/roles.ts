export const ROLES = [
  {
    id: "super_admin",
    title: "Super Administrator",
    description: "Full platform administration and system oversight",
    initials: "SA",
    color: "orange",
  },
  {
    id: "admin",
    title: "Administrator",
    description: "Academy management and administrative operations",
    initials: "AD",
    color: "blue",
  },
  {
    id: "teacher",
    title: "Teacher",
    description: "Classes, learning activities and student progress",
    initials: "TE",
    color: "blue",
  },
  {
    id: "staff",
    title: "Staff",
    description: "Academy support and assigned staff responsibilities",
    initials: "ST",
    color: "orange",
  },
  {
    id: "cbt_officer",
    title: "CBT Officer",
    description: "Computer-based testing and examination operations",
    initials: "CB",
    color: "blue",
  },
  {
    id: "islamic_section",
    title: "Islamic Section",
    description: "Islamic studies, Quran and section activities",
    initials: "IS",
    color: "orange",
  },
  {
    id: "parent",
    title: "Parent / Guardian",
    description: "Student updates, records and communication",
    initials: "PA",
    color: "blue",
  },
  {
    id: "student",
    title: "Student",
    description: "Learning resources, results and student services",
    initials: "ST",
    color: "orange",
  },
] as const;

export type RoleId = (typeof ROLES)[number]["id"];

export function getRole(roleId: string) {
  return ROLES.find((role) => role.id === roleId);
}
