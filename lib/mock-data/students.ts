/**
 * Deterministic frontend-only data for the Students dashboard.
 *
 * TODO: Replace this module with the eventual student data source. Keep the
 * component-facing shape stable so that swap does not require a UI rewrite.
 */

export const studentSections = [
  "Section A",
  "Section B",
  "Section C",
] as const;

export type StudentSection = (typeof studentSections)[number];

export const studentStatuses = ["active", "inactive"] as const;

export type StudentStatus = (typeof studentStatuses)[number];

export type Student = {
  /** Stable frontend key; distinct from the school-issued student number. */
  id: string;
  name: string;
  studentId: string;
  section: StudentSection;
  email: string;
  contactNumber: string;
  /** A missing assignment is represented as `null`, never as display text. */
  rfid: string | null;
  status: StudentStatus;
  /** ISO timestamp; sorting and relative-time wording belong to the UI. */
  createdAt: string;
};

export type StudentFormValues = Omit<Student, "id" | "createdAt">;

export type StudentSortOption =
  | "name-asc"
  | "name-desc"
  | "newest"
  | "oldest";

export type StudentModalType = "create" | "view" | "edit" | "delete" | null;

export const STUDENTS_PER_PAGE = 5;

/** Fixed clock used to make the three sample relative times reproducible. */
export const STUDENTS_DEMO_NOW = "2026-08-13T10:00:00+08:00";

const firstNames = [
  "Aira",
  "Alyssa",
  "Andre",
  "Bea",
  "Bianca",
  "Carlo",
  "Celine",
  "Daniel",
  "Diego",
  "Ella",
  "Gabriel",
  "Grace",
  "Hannah",
  "Iris",
  "Jasmine",
  "Jose",
  "Julia",
  "Karla",
  "Lance",
  "Liza",
  "Marco",
  "Maria",
  "Miguel",
  "Nico",
  "Paolo",
  "Patricia",
  "Rafael",
  "Rina",
  "Sofia",
  "Tristan",
  "Vince",
  "Zoe",
] as const;

const lastNames = [
  "Aquino",
  "Bautista",
  "Cruz",
  "Domingo",
  "Garcia",
  "Gutierrez",
  "Mendoza",
  "Navarro",
  "Ramos",
  "Santos",
] as const;

const demoNow = Date.parse(STUDENTS_DEMO_NOW);

/**
 * Initial totals intentionally match the approved wireframe:
 * 320 students, 298 active, 22 inactive, 287 RFID assigned.
 */
export const initialStudents: Student[] = Array.from(
  { length: 320 },
  (_, index) => buildStudent(index),
);

function buildStudent(index: number): Student {
  const serial = index + 1;
  const generatedFirstName = firstNames[index % firstNames.length];
  const generatedLastName =
    lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  const generatedName = `${generatedFirstName} ${generatedLastName}`;
  const inactive = index === 2 || index >= 299;
  const unassigned = index === 2 || index >= 288;
  const section = studentSections[index % studentSections.length];
  const minutesAgo = index < 3 ? [2, 3, 15][index] : 30 + (index - 3) * 47;
  const common = {
    id: `student-${pad(serial, 3)}`,
    studentId: `STU-${pad(serial, 3)}`,
    section,
    status: inactive ? "inactive" : "active",
    createdAt: new Date(demoNow - minutesAgo * 60_000).toISOString(),
  } satisfies Pick<
    Student,
    "id" | "studentId" | "section" | "status" | "createdAt"
  >;

  if (index === 0) {
    return {
      ...common,
      name: "John Doe",
      email: "john@example.com",
      contactNumber: "+63 900 000 0000",
      rfid: "04:A2:91:FF",
    };
  }

  if (index === 1) {
    return {
      ...common,
      name: "Jane Doe",
      email: "jane@example.com",
      contactNumber: "+63 917 555 0102",
      rfid: "08:B1:32:AA",
    };
  }

  if (index === 2) {
    return {
      ...common,
      name: "Mark Smith",
      section: "Section A",
      email: "mark@example.com",
      contactNumber: "+63 918 555 0103",
      rfid: null,
    };
  }

  const emailName = `${generatedFirstName}.${generatedLastName}`.toLowerCase();

  return {
    ...common,
    name: generatedName,
    email: `${emailName}${pad(serial, 3)}@student.example.edu`,
    contactNumber: buildContactNumber(serial),
    rfid: unassigned ? null : buildRfid(serial),
  };
}

function buildContactNumber(serial: number): string {
  const network = 900 + (serial % 80);
  const middle = (serial * 37) % 1_000;
  const last = (serial * 7_919) % 10_000;

  return `+63 ${network} ${pad(middle, 3)} ${pad(last, 4)}`;
}

function buildRfid(serial: number): string {
  const highByte = Math.floor(serial / 256);
  const lowByte = serial % 256;
  const checksum = (serial * 73 + 81) % 256;

  return `04:${hex(highByte)}:${hex(lowByte)}:${hex(checksum)}`;
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

function hex(value: number): string {
  return value.toString(16).toUpperCase().padStart(2, "0");
}
