"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ProfileRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
};

type Person = {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Suspended";
  createdAt: string;
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
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
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

  return <svg {...common}>{icons[name] ?? icons.users}</svg>;
}

function mapProfile(profile: ProfileRecord): Person {
  return {
    id: profile.id,
    name: profile.full_name?.trim() || "Unnamed account",
    email: profile.email ?? "No email recorded",
    status: profile.is_active ? "Active" : "Suspended",
    createdAt: profile.created_at,
  };
}

export default function SuperAdministratorsPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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
        .eq("role", "super_admin")
        .order("created_at", { ascending: false });

      if (queryError) {
        setPeople([]);
        setError(
          "We could not load the Super Administrator directory. Check your permissions and connection, then try again.",
        );
        return;
      }

      setPeople(
        (data ?? []).map((record) =>
          mapProfile(record as ProfileRecord),
        ),
      );
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

  const filteredPeople = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return people;

    return people.filter(
      (person) =>
        person.name.toLowerCase().includes(query) ||
        person.email.toLowerCase().includes(query),
    );
  }, [people, search]);

  const activeCount = people.filter(
    (person) => person.status === "Active",
  ).length;

  return (
    <section className="people-page">
      <div className="people-heading">
        <div>
          <div className="people-eyebrow">
            PEOPLE &amp; HUMAN RESOURCES
          </div>
          <h1>Super Administrators</h1>
          <p>
            Manage accounts with the highest academy administration
            privileges.
          </p>
        </div>

        <button
          type="button"
          className="people-primary-button"
          disabled
          title="Secure account creation is being connected"
        >
          <Icon name="shield" size={18} />
          Add Super Administrator
        </button>
      </div>

      <div className="people-stat-grid">
        <article className="people-stat-card">
          <div className="people-stat-icon">
            <Icon name="shield" size={21} />
          </div>
          <div>
            <p>Super Administrators</p>
            <strong>{loading ? "—" : people.length}</strong>
            <small>Registered accounts</small>
          </div>
        </article>

        <article className="people-stat-card">
          <div className="people-stat-icon">
            <Icon name="users" size={21} />
          </div>
          <div>
            <p>Active accounts</p>
            <strong>{loading ? "—" : activeCount}</strong>
            <small>Currently active</small>
          </div>
        </article>
      </div>

      <section className="people-directory">
        <div className="people-directory-heading">
          <div>
            <span className="people-eyebrow">DIRECTORY</span>
            <h2>Super Administrator Accounts</h2>
            <p>
              Accounts assigned the <strong>super_admin</strong> role in
              the academy profile system.
            </p>
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
              placeholder="Search super administrators..."
              aria-label="Search Super Administrators"
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
            <p>Loading Super Administrator accounts…</p>
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="people-empty-state">
            <div className="people-empty-icon">
              <Icon name="shield" size={28} />
            </div>
            <h3>
              {search.trim()
                ? "No matching accounts"
                : "No Super Administrators found"}
            </h3>
            <p>
              {search.trim()
                ? "Try a different name or email address."
                : "Accounts assigned the super_admin role will appear here."}
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
