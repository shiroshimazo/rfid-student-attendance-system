"use client";

import { Add } from "iconsax-reactjs";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  initialStudents,
  STUDENTS_DEMO_NOW,
  STUDENTS_PER_PAGE,
  type Student,
  type StudentFormValues,
  type StudentModalType,
  type StudentSortOption,
} from "@/lib/mock-data/students";

import { RecentlyAddedCard } from "./RecentlyAddedCard";
import { RfidStatusCard } from "./RfidStatusCard";
import { StudentDialog } from "./StudentDialog";
import { StudentDirectoryCard } from "./StudentDirectoryCard";
import type {
  StudentSectionFilter,
  StudentStatusFilter,
} from "./StudentFilterSelect";
import { StudentsSummaryCards } from "./StudentsSummaryCards";

export function StudentsDashboard() {
  const [students, setStudents] = useState<Student[]>(() =>
    initialStudents.map((student) => ({ ...student })),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] =
    useState<StudentSectionFilter>("all");
  const [selectedStatus, setSelectedStatus] =
    useState<StudentStatusFilter>("all");
  const [sortOption, setSortOption] =
    useState<StudentSortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalType, setModalType] = useState<StudentModalType>(null);
  const [announcement, setAnnouncement] = useState("");

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const rows = students.filter((student) => {
      const matchesQuery =
        query.length === 0 ||
        student.name.toLocaleLowerCase().includes(query) ||
        student.studentId.toLocaleLowerCase().includes(query) ||
        student.rfid?.toLocaleLowerCase().includes(query);
      const matchesSection =
        selectedSection === "all" || student.section === selectedSection;
      const matchesStatus =
        selectedStatus === "all" || student.status === selectedStatus;

      return matchesQuery && matchesSection && matchesStatus;
    });

    return rows.sort((left, right) => {
      if (sortOption === "name-asc" || sortOption === "name-desc") {
        const order = left.name.localeCompare(right.name, "en", {
          sensitivity: "base",
        });
        const withTieBreak = order || left.studentId.localeCompare(right.studentId);
        return sortOption === "name-asc" ? withTieBreak : -withTieBreak;
      }

      const order = Date.parse(right.createdAt) - Date.parse(left.createdAt);
      const withTieBreak = order || left.studentId.localeCompare(right.studentId);
      return sortOption === "newest" ? withTieBreak : -withTieBreak;
    });
  }, [searchQuery, selectedSection, selectedStatus, sortOption, students]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, pageCount);
  const pageStart = (safePage - 1) * STUDENTS_PER_PAGE;
  const pageRows = filteredStudents.slice(
    pageStart,
    pageStart + STUDENTS_PER_PAGE,
  );

  function openModal(
    type: Exclude<StudentModalType, null>,
    student: Student | null = null,
  ) {
    setSelectedStudent(student);
    setModalType(type);
  }

  function closeModal() {
    setModalType(null);
    setSelectedStudent(null);
  }

  function handleCreate(values: StudentFormValues) {
    const newestCreatedAt = students.reduce(
      (latest, student) => Math.max(latest, Date.parse(student.createdAt)),
      0,
    );
    const next: Student = {
      ...values,
      id: `student-local-${crypto.randomUUID()}`,
      // The deterministic seed has a fixed demo clock. Advancing its newest
      // timestamp guarantees a locally created profile is immediately recent.
      createdAt: new Date(
        Math.max(Date.now(), Date.parse(STUDENTS_DEMO_NOW), newestCreatedAt) + 1,
      ).toISOString(),
    };

    setStudents((previous) => [next, ...previous]);
    setCurrentPage(1);
    setAnnouncement(`${next.name} was created. Dashboard totals updated.`);
    closeModal();
  }

  function handleUpdate(studentId: string, values: StudentFormValues) {
    const current = students.find((student) => student.id === studentId);
    setStudents((previous) =>
      previous.map((student) =>
        student.id === studentId ? { ...student, ...values } : student,
      ),
    );
    setCurrentPage(1);
    setAnnouncement(
      `${values.name || current?.name || "Student"} was updated. Dashboard totals refreshed.`,
    );
    closeModal();
  }

  function handleDelete(studentId: string) {
    const current = students.find((student) => student.id === studentId);
    setStudents((previous) =>
      previous.filter((student) => student.id !== studentId),
    );
    setCurrentPage(1);
    setAnnouncement(
      `${current?.name ?? "Student"} was deleted. Dashboard totals updated.`,
    );
    closeModal();
  }

  function resetDirectory() {
    setSearchQuery("");
    setSelectedSection("all");
    setSelectedStatus("all");
    setSortOption("newest");
    setCurrentPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-medium tracking-tight text-balance text-card-foreground">
            Students
          </h1>
          <p className="mt-1 text-sm text-pretty text-muted-foreground">
            Manage student profiles, RFID cards, and enrollment information
          </p>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={() => openModal("create")}
          className="min-h-11 self-start px-3 sm:min-h-10 sm:self-auto"
        >
          <Add data-icon="inline-start" aria-hidden="true" />
          Add Student
        </Button>
      </header>

      <StudentsSummaryCards students={students} />

      <StudentDirectoryCard
        rows={pageRows}
        totalRows={filteredStudents.length}
        page={safePage}
        pageCount={pageCount}
        searchQuery={searchQuery}
        section={selectedSection}
        status={selectedStatus}
        sort={sortOption}
        onSearchChange={(query) => {
          setSearchQuery(query);
          setCurrentPage(1);
        }}
        onSectionChange={(section) => {
          setSelectedSection(section);
          setCurrentPage(1);
        }}
        onStatusChange={(status) => {
          setSelectedStatus(status);
          setCurrentPage(1);
        }}
        onSortChange={(sort) => {
          setSortOption(sort);
          setCurrentPage(1);
        }}
        onPageChange={setCurrentPage}
        onEdit={(student) => openModal("edit", student)}
        onView={(student) => openModal("view", student)}
        onDelete={(student) => openModal("delete", student)}
        onResetFilters={resetDirectory}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentlyAddedCard students={students} />
        <RfidStatusCard students={students} />
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      {modalType === null ? null : (
        <StudentDialog
          key={`${modalType}-${selectedStudent?.id ?? "new"}`}
          modalType={modalType}
          student={selectedStudent}
          students={students}
          onClose={closeModal}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
