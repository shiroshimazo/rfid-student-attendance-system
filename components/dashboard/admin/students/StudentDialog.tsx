"use client";

import { Dialog } from "@base-ui/react/dialog";
import { CloseCircle, Danger } from "iconsax-reactjs";
import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  studentSections,
  type Student,
  type StudentFormValues,
  type StudentModalType,
} from "@/lib/mock-data/students";
import { cn } from "@/lib/utils";

type StudentDialogProps = {
  modalType: Exclude<StudentModalType, null>;
  student: Student | null;
  students: Student[];
  onClose: () => void;
  onCreate: (values: StudentFormValues) => void;
  onUpdate: (studentId: string, values: StudentFormValues) => void;
  onDelete: (studentId: string) => void;
};

type FormErrors = Partial<Record<keyof StudentFormValues, string>>;

const emptyValues: StudentFormValues = {
  name: "",
  studentId: "",
  section: "Section A",
  email: "",
  contactNumber: "",
  rfid: null,
  status: "active",
};

const fieldClass = "space-y-1.5";
const selectClass = cn(
  "h-11 w-full rounded-lg border border-input bg-input/30 px-2.5 text-base text-foreground outline-none sm:h-10 md:text-sm",
  "transition-[background-color,border-color,box-shadow] duration-150 hover:bg-input/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

function normalizeValues(values: StudentFormValues): StudentFormValues {
  return {
    name: values.name.trim().replace(/\s+/g, " "),
    studentId: values.studentId.trim().toUpperCase(),
    section: values.section,
    email: values.email.trim().toLowerCase(),
    contactNumber: values.contactNumber.trim(),
    rfid: values.rfid?.trim() ? values.rfid.trim().toUpperCase() : null,
    status: values.status,
  };
}

function validateValues(
  values: StudentFormValues,
  students: Student[],
  currentStudent: Student | null,
): FormErrors {
  const errors: FormErrors = {};
  const normalized = normalizeValues(values);

  if (!normalized.name) errors.name = "Student name is required.";
  if (!normalized.studentId) errors.studentId = "Student ID is required.";
  if (!normalized.email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!normalized.contactNumber) {
    errors.contactNumber = "Contact number is required.";
  }

  const duplicateId = students.some(
    (student) =>
      student.id !== currentStudent?.id &&
      student.studentId.toLowerCase() === normalized.studentId.toLowerCase(),
  );
  if (duplicateId) errors.studentId = "This Student ID is already in use.";

  if (normalized.rfid) {
    const duplicateRfid = students.some(
      (student) =>
        student.id !== currentStudent?.id &&
        student.rfid?.toLowerCase() === normalized.rfid?.toLowerCase(),
    );
    if (duplicateRfid) errors.rfid = "This RFID card is already assigned.";
  }

  return errors;
}

function ReadOnlyDetails({ student }: { student: Student }) {
  const fields = [
    ["Student Name", student.name],
    ["Student ID", student.studentId],
    ["Section", student.section],
    ["Email", student.email],
    ["Contact Number", student.contactNumber],
    ["RFID Card", student.rfid ?? "Unassigned"],
  ];

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/35 p-3">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-sm font-medium text-muted-foreground"
        >
          {student.name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-card-foreground">
            {student.name}
          </p>
          <p className="mt-0.5 truncate text-xs tabular-nums text-muted-foreground">
            {student.studentId} · {student.section}
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[0.6875rem] text-muted-foreground">{label}</dt>
            <dd
              className={cn(
                "mt-1 break-words text-sm text-card-foreground",
                label === "Student ID" || label === "RFID Card"
                  ? "font-mono tabular-nums"
                  : "",
              )}
            >
              {value}
            </dd>
          </div>
        ))}
        <div className="min-w-0">
          <dt className="text-[0.6875rem] text-muted-foreground">Status</dt>
          <dd className="mt-1">
            <Badge variant={student.status === "active" ? "ink" : "destructive"}>
              {student.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function StudentDialog({
  modalType,
  student,
  students,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: StudentDialogProps) {
  const editing = modalType === "edit";
  const [values, setValues] = useState<StudentFormValues>(() =>
    editing && student
      ? {
          name: student.name,
          studentId: student.studentId,
          section: student.section,
          email: student.email,
          contactNumber: student.contactNumber,
          rfid: student.rfid,
          status: student.status,
        }
      : emptyValues,
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const title =
    modalType === "create"
      ? "New Student"
      : modalType === "view"
        ? "Student Details"
        : modalType === "edit"
          ? "Update Student"
          : "Delete Student";

  const description =
    modalType === "create"
      ? "Create a frontend student profile and optional RFID assignment."
      : modalType === "view"
        ? "Read-only student profile and enrollment information."
        : modalType === "edit"
          ? "Update student information, RFID assignment, section, and status."
          : "This action removes the student from the current dashboard state.";

  function updateField<Key extends keyof StudentFormValues>(
    field: Key,
    value: StudentFormValues[Key],
  ) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateValues(values, students, editing ? student : null);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstInvalid = Object.keys(nextErrors)[0];
      if (firstInvalid) {
        requestAnimationFrame(() => {
          document
            .querySelector<HTMLElement>(`[name="${firstInvalid}"]`)
            ?.focus();
        });
      }
      return;
    }

    const normalized = normalizeValues(values);
    if (editing && student) {
      onUpdate(student.id, normalized);
    } else {
      onCreate(normalized);
    }
  }

  const formMode = modalType === "create" || modalType === "edit";

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 min-h-dvh bg-brand-base/75 backdrop-blur-[2px] transition-opacity duration-200 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex min-h-dvh items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4">
          <Dialog.Popup
            role={modalType === "delete" ? "alertdialog" : "dialog"}
            aria-modal="true"
            className={cn(
              "flex max-h-[95dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-card text-card-foreground shadow-2xl outline-none",
              "transition-[transform,opacity] duration-200 ease-out data-ending-style:translate-y-3 data-ending-style:opacity-0 data-starting-style:translate-y-3 data-starting-style:opacity-0 sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl",
              modalType === "delete" ? "sm:max-w-md" : "sm:max-w-xl",
            )}
          >
            <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
              <div className="min-w-0">
                <Dialog.Title className="font-heading text-lg font-medium tracking-tight text-balance text-card-foreground">
                  {title}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-pretty text-muted-foreground">
                  {description}
                </Dialog.Description>
              </div>
              <Dialog.Close
                render={
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label={`Close ${title.toLowerCase()} dialog`}
                    className="size-11 sm:size-10"
                  >
                    <CloseCircle aria-hidden="true" />
                  </Button>
                }
              />
            </div>

            {modalType === "view" && student ? (
              <ReadOnlyDetails student={student} />
            ) : null}

            {modalType === "delete" && student ? (
              <div className="px-5 py-6 sm:px-6">
                <div className="flex gap-3 rounded-xl bg-destructive/10 p-4">
                  <Danger
                    size={20}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-destructive"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-card-foreground">
                      Are you sure you want to delete this student?
                    </p>
                    <p className="mt-1 text-xs text-pretty text-muted-foreground">
                      {student.name} ({student.studentId}) will be removed from
                      the directory and dashboard totals.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {formMode ? (
              <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
                <div className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
                  {editing ? (
                    <h3 className="mb-3 font-heading text-xs font-medium tracking-tight text-card-foreground">
                      Student Info
                    </h3>
                  ) : null}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className={fieldClass}>
                      <Label htmlFor="student-name">Student Name</Label>
                      <Input
                        id="student-name"
                        name="name"
                        required
                        autoFocus
                        value={values.name}
                        onChange={(event) => updateField("name", event.target.value)}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? "student-name-error" : undefined}
                        className="h-11 sm:h-10"
                        placeholder="e.g. Alex Rivera"
                      />
                      {errors.name ? (
                        <p role="alert" id="student-name-error" className="text-[0.6875rem] text-destructive-foreground">
                          {errors.name}
                        </p>
                      ) : null}
                    </div>

                    <div className={fieldClass}>
                      <Label htmlFor="student-id">Student ID</Label>
                      <Input
                        id="student-id"
                        name="studentId"
                        required
                        value={values.studentId}
                        onChange={(event) => updateField("studentId", event.target.value)}
                        aria-invalid={Boolean(errors.studentId)}
                        aria-describedby={errors.studentId ? "student-id-error" : undefined}
                        className="h-11 font-mono uppercase sm:h-10"
                        placeholder="STU-321"
                      />
                      {errors.studentId ? (
                        <p role="alert" id="student-id-error" className="text-[0.6875rem] text-destructive-foreground">
                          {errors.studentId}
                        </p>
                      ) : null}
                    </div>

                    <div className={fieldClass}>
                      <Label htmlFor="student-section">Section</Label>
                      <select
                        id="student-section"
                        name="section"
                        value={values.section}
                        onChange={(event) =>
                          updateField("section", event.target.value as StudentFormValues["section"])
                        }
                        className={selectClass}
                      >
                        {studentSections.map((section) => (
                          <option key={section} value={section}>
                            {section}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={fieldClass}>
                      <Label htmlFor="student-email">Email</Label>
                      <Input
                        id="student-email"
                        name="email"
                        type="email"
                        required
                        value={values.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? "student-email-error" : undefined}
                        className="h-11 sm:h-10"
                        placeholder="alex@example.com"
                      />
                      {errors.email ? (
                        <p role="alert" id="student-email-error" className="text-[0.6875rem] text-destructive-foreground">
                          {errors.email}
                        </p>
                      ) : null}
                    </div>

                    <div className={fieldClass}>
                      <Label htmlFor="student-contact">Contact Number</Label>
                      <Input
                        id="student-contact"
                        name="contactNumber"
                        type="tel"
                        required
                        value={values.contactNumber}
                        onChange={(event) => updateField("contactNumber", event.target.value)}
                        aria-invalid={Boolean(errors.contactNumber)}
                        aria-describedby={errors.contactNumber ? "student-contact-error" : undefined}
                        className="h-11 tabular-nums sm:h-10"
                        placeholder="+63 900 000 0000"
                      />
                      {errors.contactNumber ? (
                        <p role="alert" id="student-contact-error" className="text-[0.6875rem] text-destructive-foreground">
                          {errors.contactNumber}
                        </p>
                      ) : null}
                    </div>

                    <div className={fieldClass}>
                      <Label htmlFor="student-rfid">
                        {editing ? "RFID Assignment" : "RFID Card"}
                        <span className="font-normal text-muted-foreground">Optional</span>
                      </Label>
                      <Input
                        id="student-rfid"
                        name="rfid"
                        value={values.rfid ?? ""}
                        onChange={(event) => updateField("rfid", event.target.value || null)}
                        aria-invalid={Boolean(errors.rfid)}
                        aria-describedby={errors.rfid ? "student-rfid-error" : "student-rfid-hint"}
                        className="h-11 font-mono uppercase sm:h-10"
                        placeholder="04:A2:91:FF"
                      />
                      {errors.rfid ? (
                        <p role="alert" id="student-rfid-error" className="text-[0.6875rem] text-destructive-foreground">
                          {errors.rfid}
                        </p>
                      ) : (
                        <p id="student-rfid-hint" className="text-[0.6875rem] text-muted-foreground">
                          Leave blank to keep this student unassigned.
                        </p>
                      )}
                    </div>

                    <div className={fieldClass}>
                      <Label htmlFor="student-status">Status</Label>
                      <select
                        id="student-status"
                        name="status"
                        value={values.status}
                        onChange={(event) =>
                          updateField("status", event.target.value as StudentFormValues["status"])
                        }
                        className={selectClass}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
                  <Dialog.Close
                    render={
                      <Button variant="outline" size="lg" className="min-h-11 sm:min-h-10">
                        Cancel
                      </Button>
                    }
                  />
                  <Button type="submit" size="lg" className="min-h-11 sm:min-h-10">
                    {editing ? "Save Changes" : "Create"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
                {modalType === "delete" && student ? (
                  <>
                    <Dialog.Close
                      render={
                        <Button variant="outline" size="lg" className="min-h-11 sm:min-h-10">
                          Cancel
                        </Button>
                      }
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="lg"
                      onClick={() => onDelete(student.id)}
                      className="min-h-11 sm:min-h-10"
                    >
                      Delete
                    </Button>
                  </>
                ) : (
                  <Dialog.Close
                    render={
                      <Button variant="outline" size="lg" className="min-h-11 sm:min-h-10">
                        Close
                      </Button>
                    }
                  />
                )}
              </div>
            )}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
