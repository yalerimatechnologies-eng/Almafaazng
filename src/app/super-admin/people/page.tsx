"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Role =
  | "super_admin"
  | "admin"
  | "teacher"
  | "staff"
  | "cbt_officer"
  | "islamic"
  | "parent"
  | "student";

type SourceType =
  | "account"
  | "student_record"
  | "teacher_record"
  | "staff_record";

type Person = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: Role | string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  avatar_path?: string | null;
  sourceType: SourceType;
  hasPortalAccount: boolean;
  personnel: {
    staffId: string | null;
    admissionNumber: string | null;
    personnelStatus: string | null;
    className: string | null;
    arm: string | null;
    isDemoStudent: boolean;
  };
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

const roleLabel = (role: Role | string) =>
  roles.find((item) => item.id === role)?.label ?? role;

const formatDate = (value: string | null) => {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
};

const initials = (name: string | null, fallback: string) => {
  const source = (name ?? fallback).trim();

  const parts = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "?";

  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const sourceLabel = (person: Person) => {
  if (person.hasPortalAccount) return "Portal Account";

  switch (person.sourceType) {
    case "student_record":
      return "Student Record";
    case "teacher_record":
      return "Teacher Record";
    case "staff_record":
      return "Staff Record";
    default:
      return "Academy Record";
  }
};

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [showInvite, setShowInvite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("student");

  async function loadPeople() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/super-admin/people", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to load people.");
      }

      setPeople(result.people ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the People & HR directory.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPeople();
  }, []);

  const filteredPeople = useMemo(() => {
    const query = search.trim().toLowerCase();

    return people.filter((person) => {
      const matchesSearch =
        !query ||
        (person.full_name ?? "").toLowerCase().includes(query) ||
        (person.hasPortalAccount ? person.email : "").toLowerCase().includes(query) ||
        (person.phone ?? "").toLowerCase().includes(query) ||
        (person.personnel.staffId ?? "").toLowerCase().includes(query) ||
        (person.personnel.admissionNumber ?? "").toLowerCase().includes(query) ||
        (person.personnel.className ?? "").toLowerCase().includes(query) ||
        (person.personnel.arm ?? "").toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "all" || person.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && person.is_active) ||
        (statusFilter === "inactive" && !person.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [people, search, roleFilter, statusFilter]);

  const directoryCount = people.length;
  const portalAccountCount = people.filter(
    (person) => person.hasPortalAccount,
  ).length;
  const noPortalAccountCount = people.filter(
    (person) => !person.hasPortalAccount,
  ).length;
  const activeCount = people.filter((person) => person.is_active).length;
  const inactiveCount = people.filter((person) => !person.is_active).length;

  async function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setFormError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/super-admin/people/invite",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName,
            email,
            phone,
            role,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to create the invitation.",
        );
      }

      setSuccess(
        "Invitation created successfully. The person can complete account setup from their email.",
      );

      setFullName("");
      setEmail("");
      setPhone("");
      setRole("student");

      await loadPeople();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to create the invitation.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openInvite() {
    setShowInvite(true);
    setFormError("");
    setSuccess("");
  }

  function closeInvite() {
    if (saving) return;

    setShowInvite(false);
    setFormError("");
    setSuccess("");
  }

  return (
    <section className="people-page">
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">PEOPLE & HR</div>
          <h1 className="page-title">People Directory</h1>
          <p className="page-subtitle">
            Identity, roles and account access across ALMAFAAZ ACADEMY.
          </p>
        </div>

        <button
          type="button"
          className="primary-action"
          onClick={openInvite}
        >
          <span>+</span>
          Invite Person
        </button>
      </div>

      <div className="people-toolbar">
        <div className="people-search">
          <span>⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone, class or ID..."
            aria-label="Search people"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(event) =>
            setRoleFilter(event.target.value as "all" | Role)
          }
          aria-label="Filter by role"
        >
          <option value="all">All roles</option>

          {roles.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as "all" | "active" | "inactive",
            )
          }
          aria-label="Filter by status"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          type="button"
          className="secondary-action"
          onClick={loadPeople}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="people-alert people-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="people-alert people-alert-success">
          {success}
        </div>
      )}

      <div className="people-summary">
        <div>
          <strong>{filteredPeople.length}</strong>
          <span>
            {filteredPeople.length === 1 ? "person" : "people"} shown
          </span>
        </div>

        <div>
          <strong>{directoryCount}</strong>
          <span>directory records</span>
        </div>

        <div>
          <strong>{portalAccountCount}</strong>
          <span>portal accounts</span>
        </div>

        <div>
          <strong>{noPortalAccountCount}</strong>
          <span>without portal account</span>
        </div>

        <div>
          <strong>{activeCount}</strong>
          <span>active records</span>
        </div>

        <div>
          <strong>{inactiveCount}</strong>
          <span>inactive records</span>
        </div>
      </div>

      <div className="people-table-card">
        <div className="people-table-wrap">
          <table className="people-table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Role</th>
                <th>Academy ID</th>
                <th>Class / Arm</th>
                <th>Access</th>
                <th>Status</th>
                <th>Last login</th>
                <th>Created</th>
                <th aria-label="Actions" />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9}>
                    <div className="people-loading">
                      <div className="people-spinner" />
                      <span>Loading academy people...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPeople.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="people-empty">
                      <strong>No people found</strong>
                      <span>
                        Try another search or filter, or invite a new
                        academy account.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPeople.map((person) => {
                  const academyId =
                    person.personnel.admissionNumber ??
                    person.personnel.staffId ??
                    "Not assigned";

                  const classAndArm =
                    person.personnel.className
                      ? person.personnel.arm
                        ? `${person.personnel.className} · ${person.personnel.arm}`
                        : person.personnel.className
                      : "—";

                  const canManageProfile =
                    person.sourceType === "account";

                  const personContent = (
                    <div className="person-table-cell">
                      <div className="person-avatar">
                        {initials(
                          person.full_name,
                          person.hasPortalAccount ? person.email : academyId,
                        )}
                      </div>

                      <div className="person-table-name">
                        <strong>
                          {person.full_name || "Unnamed record"}
                        </strong>

                        <span>
                          {person.hasPortalAccount
                            ? person.email
                            : "No portal account"}
                        </span>
                      </div>
                    </div>
                  );

                  return (
                    <tr key={`${person.sourceType}-${person.id}`}>
                      <td>
                        {canManageProfile ? (
                          <Link
                            href={`/super-admin/people/${person.id}`}
                            className="person-table-link"
                          >
                            {personContent}
                          </Link>
                        ) : (
                          <div className="person-table-link">
                            {personContent}
                          </div>
                        )}
                      </td>

                      <td>
                        <span className="person-role-badge">
                          {roleLabel(person.role)}
                        </span>
                      </td>

                      <td>
                        <span className="person-identifier">
                          {academyId}
                        </span>
                      </td>

                      <td>
                        <span className="person-identifier">
                          {classAndArm}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            person.hasPortalAccount
                              ? "person-access-badge account"
                              : "person-access-badge none"
                          }
                        >
                          {sourceLabel(person)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            person.is_active
                              ? "person-status-badge active"
                              : "person-status-badge inactive"
                          }
                        >
                          <span className="person-status-dot" />
                          {person.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {person.hasPortalAccount
                          ? formatDate(person.last_login)
                          : "—"}
                      </td>

                      <td>{formatDate(person.created_at)}</td>

                      <td>
                        {canManageProfile ? (
                          <Link
                            href={`/super-admin/people/${person.id}`}
                            className="person-manage-link"
                          >
                            Manage
                          </Link>
                        ) : (
                          <span className="person-manage-link disabled">
                            Record
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showInvite && (
        <div
          className="people-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeInvite();
            }
          }}
        >
          <div
            className="people-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-person-title"
          >
            <div className="people-modal-header">
              <div>
                <div className="page-eyebrow">ACCOUNT CREATION</div>
                <h2 id="invite-person-title">Invite Person</h2>
                <p>
                  Create an academy account invitation for a member of
                  the institution.
                </p>
              </div>

              <button
                type="button"
                className="people-modal-close"
                onClick={closeInvite}
                disabled={saving}
                aria-label="Close invitation form"
              >
                ×
              </button>
            </div>

            <form
              className="people-form"
              onSubmit={submitInvite}
            >
              <label>
                Full name
                <input
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter full name"
                  required
                />
              </label>

              <label>
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="name@example.com"
                  required
                />
              </label>

              <label>
                Phone number
                <input
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="Optional phone number"
                />
              </label>

              <label>
                Academy role
                <select
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as Role)
                  }
                  required
                >
                  {roles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              {formError && (
                <div className="people-alert people-alert-error">
                  {formError}
                </div>
              )}

              {success && (
                <div className="people-alert people-alert-success">
                  {success}
                </div>
              )}

              <div className="people-form-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={closeInvite}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-action"
                  disabled={saving}
                >
                  {saving
                    ? "Creating invitation..."
                    : "Create invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
