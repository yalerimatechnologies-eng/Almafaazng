export const PEOPLE_ROLES = [
  {
    id: "super_admin",
    label: "Super Administrator",
    shortLabel: "Super Admin",
    icon: "shield",
  },
  {
    id: "admin",
    label: "Administrator",
    shortLabel: "Administrator",
    icon: "settings",
  },
  {
    id: "teacher",
    label: "Teacher",
    shortLabel: "Teachers",
    icon: "book",
  },
  {
    id: "staff",
    label: "Staff",
    shortLabel: "Staff",
    icon: "briefcase",
  },
  {
    id: "cbt_officer",
    label: "CBT Officer",
    shortLabel: "CBT Officers",
    icon: "monitor",
  },
  {
    id: "islamic_section",
    label: "Islamic Section",
    shortLabel: "Islamic Section",
    icon: "book",
  },
  {
    id: "parent",
    label: "Parent / Guardian",
    shortLabel: "Parents",
    icon: "users",
  },
  {
    id: "student",
    label: "Student",
    shortLabel: "Students",
    icon: "user",
  },
] as const;

export type PeopleRoleId = (typeof PEOPLE_ROLES)[number]["id"];

export function getPeopleRole(id: PeopleRoleId) {
  return PEOPLE_ROLES.find((role) => role.id === id);
}
