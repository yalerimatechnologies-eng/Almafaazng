"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PEOPLE_ROLES,
  type PeopleRoleId,
} from "./people-data";

type Person = {
  id: string;
  name: string;
  email: string;
  role: PeopleRoleId;
  status: "Active" | "Suspended";
  createdAt: string;
};

type ProfileRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
};

const DATABASE_ROLE_MAP: Record<string, PeopleRoleId> = {
  super_admin: "super_admin",
  admin: "admin",
  teacher: "teacher",
  staff: "staff",
  cbt_officer: "cbt_officer",
  islamic: "islamic_section",
  islamic_section: "islamic_section",
  parent: "parent",
  student: "student",
};

function Icon({
  name,
  size = 18,
}: {
  name: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const icons: Record<string, React.ReactNode> = {
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4L5.3 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1L9 7.3h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2Z" />
      </>
    ),
    book: (
      <>
        <path d="M12 7v14" />
        <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v18H5.5A2.5 2.5 0 0 0 3 23Z" />
        <path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H12v18h6.5a2.5 2.5 0 0 1 2.5 2Z" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2" />
      </>
    ),
    monitor: (
      <>
        <rect x="3" y="3" width="18" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    usersRound: (
      <>
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
        <path d="M16 4.5a4 4 0 0 1 0 7.5M21 21v-2a6 6 0 0 0-4-5.65" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" />
      </>
    ),
  };

  return <svg {...common}>{icons[name] ?? icons.user}</svg>;
}

function mapProfile(profile: ProfileRecord): Person | null {
  const role = DATABASE_ROLE_MAP[profile.role];

  if (!role) return null;

  return {
    id: profile.id,
    name: profile.full_name?.trim() || "Unnamed account",
    email: profile.email ?? "No email recorded",
    role,
    status: profile.is_active ? "Active" : "Suspended",
    createdAt: profile.created_at,
  };
}

export default function PeoplePanel() {
  const [selectedRole, setSelectedRole] =
    useState<PeopleRoleId>("teacher");
  const [search, setSearch] = useState("");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const selected = PEOPLE_ROLES.find(
    (role) => role.id === selectedRole,
  );

  const loadPeople = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setPeople([]);
        setError("Your session could not be verified. Please sign in again.");
        return;
      }

      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, is_active, created_at")
        .order("created_at", { ascending: false });

      if (queryError) {
        setPeople([]);
        setError(
          "We could not load the account directory. Check your permissions and connection, then try again.",
        );
        return;
      }

      const records = (data ?? [])
        .map((record) => mapProfile(record as ProfileRecord))
        .filter((record): record is Person => record !== null);

      setPeople(records);
    } catch {
      setPeople([]);
      setError("A connection error prevented the directory from loading.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPeople();
  }, [loadPeople]);

  const rolePeople = useMemo(
    () => people.filter((person) => person.role === selectedRole),
    [people, selectedRole],
  );

  const filteredPeople = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return rolePeople;

    return rolePeople.filter(
      (person) =>
        person.name.toLowerCase().includes(query) ||
        person.email.toLowerCase().includes(query),
    );
  }, [rolePeople, search]);

  const activeCount = rolePeople.filter(
    (person) => person.status === "Active",
  ).length;

  return (
    <section className="people-page">
      <div className="people-heading">
        <div>
          <div className="people-eyebrow">
            PEOPLE &amp; HUMAN RESOURCES
          </div>
          <h1>People &amp; HR</h1>
          <p>
            Manage academy accounts, roles, access and institutional
            personnel from one workspace.
          </p>
        </div>

        <button
          type="button"
          className="people-primary-button"
          disabled
          title="Secure account creation is being connected"
        >
          <Icon name="plus" size={18} />
          Add {selected?.shortLabel.replace(/s$/, "") ?? "Person"}
        </button>
      </div>

      <div className="people-role-control">
        <div className="people-role-label">
          <span>ACCOUNT DIRECTORY</span>
          <strong>Choose a role</strong>
        </div>

        <div className="people-role-select">
          <button
            type="button"
            className="people-role-trigger"
            onClick={() => setRoleMenuOpen((open) => !open)}
            aria-expanded={roleMenuOpen}
          >
            <span className="people-role-trigger-icon">
              <Icon name={selected?.icon ?? "users"} size={19} />
            </span>
            <span>
              <strong>{selected?.label}</strong>
              <small>View accounts assigned to this role</small>
            </span>
            <span
              className={`people-role-chevron ${
                roleMenuOpen ? "is-open" : ""
              }`}
            >
              <Icon name="chevron" size={17} />
            </span>
          </button>

          {roleMenuOpen && (
            <div className="people-role-menu">
              {PEOPLE_ROLES.map((role) => (
                <button
                  type="button"
                  key={role.id}
                  className={`people-role-menu-item ${
                    role.id === selectedRole ? "is-selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedRole(role.id);
                    setRoleMenuOpen(false);
                    setSearch("");
                  }}
                >
                  <span className="people-role-menu-icon">
                    <Icon name={role.icon} size={17} />
                  </span>
                  <span>
                    <strong>{role.label}</strong>
                    <small>
                      Manage {role.shortLabel.toLowerCase()}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="people-stat-grid">
        <article className="people-stat-card">
          <div className="people-stat-icon">
            <Icon name={selected?.icon ?? "users"} size={21} />
          </div>
          <div>
            <p>{selected?.shortLabel ?? "Accounts"}</p>
            <strong>{loading ? "—" : rolePeople.length}</strong>
            <small>Registered accounts</small>
          </div>
        </article>

        <article className="people-stat-card">
          <div className="people-stat-icon">
            <Icon name="usersRound" size={21} />
          </div>
          <div>
            <p>Active accounts</p>
            <strong>{loading ? "—" : activeCount}</strong>
            <small>In the selected role</small>
          </div>
        </article>
      </div>

      <section className="people-directory">
        <div className="people-directory-heading">
          <div>
            <span className="people-eyebrow">DIRECTORY</span>
            <h2>{selected?.label}</h2>
            <p>Accounts assigned to the selected academy role.</p>
          </div>

          <span className="people-record-count">
            {loading ? "Loading…" : `${filteredPeople.length} records`}
          </span>
        </div>

        <div className="people-toolbar">
          <label className="people-search">
            <Icon name="search" size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${selected?.shortLabel.toLowerCase()}...`}
              aria-label="Search people"
            />
          </label>

          <button
            type="button"
            className="people-secondary-button"
            onClick={() => void loadPeople(true)}
            disabled={loading || refreshing}
          >
            <Icon name="refresh" size={16} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {error ? (
          <div className="people-empty-state" role="alert">
            <h3>Unable to load accounts</h3>
            <p>{error}</p>
            <button
              type="button"
              className="people-secondary-button"
              onClick={() => void loadPeople()}
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="people-empty-state" aria-live="polite">
            <p>Loading academy accounts…</p>
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="people-empty-state">
            <div className="people-empty-icon">
              <Icon name={selected?.icon ?? "users"} size={28} />
            </div>
            <h3>
              {search.trim()
                ? "No matching accounts"
                : `No ${selected?.shortLabel.toLowerCase()} yet`}
            </h3>
            <p>
              {search.trim()
                ? "Try a different name or email address."
                : "Accounts assigned to this role will appear here after they are created."}
            </p>
          </div>
        ) : (
          <div className="people-table-wrap">
            <table className="people-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPeople.map((person) => (
                  <tr key={person.id}>
                    <td>{person.name}</td>
                    <td>{person.email}</td>
                    <td>
                      <span
                        className={`people-status ${
                          person.status === "Active"
                            ? "is-active"
                            : "is-inactive"
                        }`}
                      >
                        {person.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
