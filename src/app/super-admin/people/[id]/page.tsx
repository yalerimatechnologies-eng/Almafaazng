"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Role =
  | "super_admin"
  | "admin"
  | "teacher"
  | "staff"
  | "cbt_officer"
  | "islamic"
  | "parent"
  | "student";

type AuditLog = {
  id: number;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_email: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type Person = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  is_active: boolean;
  created_by: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  personnel: {
    staff: {
      id: string;
      staff_id: string;
      full_name: string;
      status: string;
    } | null;
    teacher: {
      id: string;
      staff_id: string;
      full_name: string;
      status: string;
    } | null;
    student: {
      id: string;
      admission_number: string;
      full_name: string;
      status: string;
      first_name: string | null;
      last_name: string | null;
      gender: string | null;
      date_of_birth: string | null;
      class_id: string | null;
      arm: string | null;
      parent_name: string | null;
      parent_phone: string | null;
      parent_email: string | null;
      address: string | null;
    } | null;
  };
  auditLogs: AuditLog[];
};

const roles: { id: Role; label: string }[] = [
  { id: "super_admin", label: "Super Administrator" },
  { id: "admin", label: "Administrator" },
  { id: "teacher", label: "Teacher" },
  { id: "staff", label: "Staff" },
  { id: "cbt_officer", label: "CBT Officer" },
  { id: "islamic", label: "Islamic Section" },
  { id: "parent", label: "Parent / Guardian" },
  { id: "student", label: "Student" },
];

function roleLabel(role: Role) {
  return roles.find((item) => item.id === role)?.label ?? role;
}

function formatDate(value: string | null) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function actionLabel(action: string) {
  return action
    .replace(/^people\./, "")
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PersonDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [selectedRole, setSelectedRole] = useState<Role | "">("");
  const [selectedStatus, setSelectedStatus] = useState<boolean | null>(
    null,
  );

  async function loadPerson() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/super-admin/people/${params.id}`,
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to load person.");
      }

      setPerson(result.person);
      setSelectedRole(result.person.role);
      setSelectedStatus(result.person.is_active);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load person details.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) {
      loadPerson();
    }
  }, [params.id]);

  async function saveAccess() {
    if (!person || !selectedRole || selectedStatus === null) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/super-admin/people/${person.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: selectedRole,
            is_active: selectedStatus,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to update account.",
        );
      }

      setMessage("Account access updated successfully.");
      await loadPerson();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update account access.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="person-details-page">
        <div className="people-loading">
          <div className="people-spinner" />
          <span>Loading person...</span>
        </div>
      </section>
    );
  }

  if (error && !person) {
    return (
      <section className="person-details-page">
        <button
          type="button"
          className="secondary-action"
          onClick={() => router.push("/super-admin/people")}
        >
          ← Back to People
        </button>

        <div className="people-alert people-alert-error person-page-error">
          {error}
        </div>
      </section>
    );
  }

  if (!person) return null;

  const personnelId =
    person.personnel.staff?.staff_id ??
    person.personnel.teacher?.staff_id ??
    person.personnel.student?.admission_number ??
    "Not assigned";

  return (
    <section className="person-details-page">
      <div className="person-page-top">
        <button
          type="button"
          className="secondary-action"
          onClick={() => router.push("/super-admin/people")}
        >
          ← People Directory
        </button>
      </div>

      <div className="person-hero">
        <div className="person-large-avatar">
          {(person.full_name ?? person.email)
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="person-hero-main">
          <div className="page-eyebrow">ACADEMY IDENTITY</div>
          <h1 className="page-title">
            {person.full_name || "Unnamed account"}
          </h1>

          <div className="person-hero-meta">
            <span>{person.email}</span>
            <span>•</span>
            <span>{roleLabel(person.role)}</span>
            <span>•</span>
            <span
              className={
                person.is_active
                  ? "person-active-text"
                  : "person-inactive-text"
              }
            >
              {person.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="people-alert people-alert-error">
          {error}
        </div>
      )}

      {message && (
        <div className="people-alert people-alert-success">
          {message}
        </div>
      )}

      <div className="person-detail-grid">
        <div className="person-main-column">
          <section className="person-card">
            <div className="person-card-heading">
              <div>
                <div className="page-eyebrow">IDENTITY</div>
                <h2>Account information</h2>
              </div>
            </div>

            <div className="person-info-grid">
              <div>
                <span>Full name</span>
                <strong>{person.full_name || "—"}</strong>
              </div>

              <div>
                <span>Email address</span>
                <strong>{person.email}</strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>{person.phone || "—"}</strong>
              </div>

              <div>
                <span>Academy identifier</span>
                <strong>{personnelId}</strong>
              </div>

              <div>
                <span>Last login</span>
                <strong>{formatDate(person.last_login)}</strong>
              </div>

              <div>
                <span>Account created</span>
                <strong>{formatDate(person.created_at)}</strong>
              </div>
            </div>
          </section>

          {person.personnel.student && (
            <section className="person-card">
              <div className="person-card-heading">
                <div>
                  <div className="page-eyebrow">STUDENT RECORD</div>
                  <h2>Student information</h2>
                </div>
              </div>

              <div className="person-info-grid">
                <div>
                  <span>Admission number</span>
                  <strong>
                    {person.personnel.student.admission_number}
                  </strong>
                </div>

                <div>
                  <span>Student status</span>
                  <strong>
                    {person.personnel.student.status || "—"}
                  </strong>
                </div>

                <div>
                  <span>Gender</span>
                  <strong>
                    {person.personnel.student.gender || "—"}
                  </strong>
                </div>

                <div>
                  <span>Date of birth</span>
                  <strong>
                    {person.personnel.student.date_of_birth || "—"}
                  </strong>
                </div>

                <div>
                  <span>Parent / Guardian</span>
                  <strong>
                    {person.personnel.student.parent_name || "—"}
                  </strong>
                </div>

                <div>
                  <span>Parent phone</span>
                  <strong>
                    {person.personnel.student.parent_phone || "—"}
                  </strong>
                </div>

                <div className="person-info-wide">
                  <span>Address</span>
                  <strong>
                    {person.personnel.student.address || "—"}
                  </strong>
                </div>
              </div>
            </section>
          )}

          <section className="person-card">
            <div className="person-card-heading">
              <div>
                <div className="page-eyebrow">ACCOUNT HISTORY</div>
                <h2>Audit activity</h2>
              </div>
            </div>

            {person.auditLogs.length === 0 ? (
              <div className="person-empty-history">
                No recorded audit activity for this account.
              </div>
            ) : (
              <div className="person-audit-list">
                {person.auditLogs.map((log) => (
                  <div className="person-audit-row" key={log.id}>
                    <div className="audit-marker" />

                    <div className="audit-content">
                      <strong>{actionLabel(log.action)}</strong>
                      <span>
                        By {log.actor_email || "System"} ·{" "}
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="person-side-column">
          <section className="person-card access-card">
            <div className="person-card-heading">
              <div>
                <div className="page-eyebrow">ACCESS CONTROL</div>
                <h2>Role & status</h2>
              </div>
            </div>

            <label className="access-field">
              <span>Academy role</span>
              <select
                value={selectedRole}
                onChange={(event) =>
                  setSelectedRole(event.target.value as Role)
                }
                disabled={person.role === "super_admin"}
              >
                {roles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="access-field">
              <span>Account status</span>
              <select
                value={selectedStatus ? "active" : "inactive"}
                onChange={(event) =>
                  setSelectedStatus(event.target.value === "active")
                }
                disabled={person.role === "super_admin"}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>

            {person.role === "super_admin" && (
              <div className="protected-note">
                Super Administrator access is protected from
                self-service role/status changes.
              </div>
            )}

            <button
              type="button"
              className="primary-action access-save"
              onClick={saveAccess}
              disabled={
                saving ||
                person.role === "super_admin"
              }
            >
              {saving ? "Saving..." : "Save access changes"}
            </button>
          </section>

          <section className="person-card">
            <div className="person-card-heading">
              <div>
                <div className="page-eyebrow">SYSTEM RECORD</div>
                <h2>Identifiers</h2>
              </div>
            </div>

            <div className="system-id-list">
              <div>
                <span>Profile ID</span>
                <code>{person.id}</code>
              </div>

              <div>
                <span>Created by</span>
                <code>{person.created_by || "System"}</code>
              </div>

              <div>
                <span>Updated</span>
                <strong>{formatDate(person.updated_at)}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
