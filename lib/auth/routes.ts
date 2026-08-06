export const dashboardByRole = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
} as const;

export type AppRole = keyof typeof dashboardByRole;

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && value in dashboardByRole;
}
