"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { supabase } from "@/lib/supabase";

type Stats = {
  students: number;
  teachers: number;
  staff: number;
  sessions: number;
};

type IconType =
  | "people"
  | "academic"
  | "cbt"
  | "report"
  | "finance"
  | "settings";

type Accent =
  | "green"
  | "silver"
  | "red"
  | "black";

function Icon({ type }: { type: IconType }) {
  const paths = {
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20c.5-3.2 2.2-5 5.5-5s5 1.8 5.5 5M16 11a3 3 0 1 0 0-6M16 15c2.8 0 4.2 1.7 4.7 5" />
      </>
    ),
    academic: (
      <>
        <path d="m3 9 9-5 9 5-9 5-9-5Z" />
        <path d="M7 11.5V16c3 2 7 2 10 0v-4.5M21 10v6" />
      </>
    ),
    cbt: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 8h2M15 8h2M7 12h2M15 12h2M7 16h10" />
      </>
    ),
    report: (
      <>
        <path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v5h5M8 13h8M8 17h6M8 9h3" />
      </>
    ),
    finance: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M15 9.5c-.7-1-1.7-1.5-3-1.5-1.7 0-3 1-3 2.3 0 3.2 6 1.3 6 4.4 0 1.3-1.3 2.3-3 2.3-1.4 0-2.5-.5-3.2-1.5" />
      </>
    ),
    settings: (
      <>
        <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0-0-8Z" />
        <path d="M4.9 4.9 7 7M17 17l2.1 2.1M3 12h3M18 12h3M4.9 19.1 7 17M17 7l2.1-2.1M12 3v3M12 18v3" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[type]}
    </svg>
  );
}

const modules: Array<{
  number: string;
  title: string;
  description: string;
  href: string;
  icon: IconType;
  accent: Accent;
}> = [
  {
    number: "01",
    title: "People & HR",
    description:
      "Manage administrators, teachers, staff, parents, students and institutional personnel.",
    href: "/super-admin/people",
    icon: "people",
    accent: "silver",
  },
  {
    number: "02",
    title: "Academics",
    description:
      "Control academic sessions, classes, subjects, schemes, lesson plans and timetables.",
    href: "/super-admin/academics",
    icon: "academic",
    accent: "green",
  },
  {
    number: "03",
    title: "CBT & Examinations",
    description:
      "Manage examinations, question banks, CBT operations and examination results.",
    href: "/super-admin/cbt",
    icon: "cbt",
    accent: "red",
  },
  {
    number: "04",
    title: "Reports & Intelligence",
    description:
      "Access institutional reports, academic reports and performance intelligence.",
    href: "/super-admin/reports",
    icon: "report",
    accent: "black",
  },
  {
    number: "05",
    title: "Finance",
    description:
      "Manage fees, payments and financial reporting across the academy.",
    href: "/super-admin/finance",
    icon: "finance",
    accent: "silver",
  },
  {
    number: "06",
    title: "System Settings",
    description:
      "Control institutional settings, security, audit and system configuration.",
    href: "/super-admin/settings",
    icon: "settings",
    accent: "black",
  },
];

const metricDefinitions: Array<{
  key: keyof Stats;
  label: string;
  note: string;
  icon: IconType;
  accent: Accent;
}> = [
  {
    key: "students",
    label: "Students",
    note: "Registered student records",
    icon: "people",
    accent: "green",
  },
  {
    key: "teachers",
    label: "Teachers",
    note: "Teaching personnel records",
    icon: "academic",
    accent: "green",
  },
  {
    key: "staff",
    label: "Staff",
    note: "Operational staff records",
    icon: "people",
    accent: "silver",
  },
  {
    key: "sessions",
    label: "Academic Sessions",
    note: "Configured academic sessions",
    icon: "academic",
    accent: "black",
  },
];

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    students: 0,
    teachers: 0,
    staff: 0,
    sessions: 0,
  });

  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState("");

  const loadStats = async () => {
    setLoading(true);

    const [students, teachers, staff, sessions] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("teachers").select("id", { count: "exact", head: true }),
      supabase.from("staff").select("id", { count: "exact", head: true }),
      supabase
        .from("academic_sessions")
        .select("id", { count: "exact", head: true }),
    ]);

    setStats({
      students: students.count ?? 0,
      teachers: teachers.count ?? 0,
      staff: staff.count ?? 0,
      sessions: sessions.count ?? 0,
    });

    setUpdated(
      new Intl.DateTimeFormat("en-NG", {
        timeZone: "Africa/Lagos",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(new Date()),
    );

    setLoading(false);
  };

  useEffect(() => {
    void loadStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-inner">
          <img
            className="dashboard-loading-logo"
            src="/almafaaz-logo.png"
            alt="ALMAFAAZ ACADEMY"
          />
          <div className="dashboard-loader" />
          <div className="dashboard-loading-text">
            Loading ALMAFAAZ ACADEMY...
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell>
      <section className="dashboard-welcome">
        <div>
          <div className="dashboard-eyebrow">Super Administrator</div>
          <h1>Institutional Control Centre</h1>
          <p>
            Central management of people, academics, examinations, finance and
            academy operations.
          </p>
        </div>

        <button className="dashboard-refresh" onClick={() => void loadStats()}>
          Refresh data
        </button>
      </section>

      <section className="dashboard-command">
        <div className="dashboard-command-copy">
          <strong>Academy management system</strong>
          <span>
            Live information is retrieved from the connected institutional
            database.
          </span>
        </div>

        <div className="dashboard-command-time">
          <strong>Last updated {updated}</strong>
          <span>Africa/Lagos</span>
        </div>
      </section>

      <section className="dashboard-metrics">
        {metricDefinitions.map((metric) => (
          <div
            className={`dashboard-metric dashboard-accent-${metric.accent}`}
            key={metric.key}
          >
            <div className="dashboard-metric-top">
              <span className="dashboard-metric-label">
                {metric.label}
              </span>

              <span className="dashboard-metric-icon">
                <Icon type={metric.icon} />
              </span>
            </div>

            <div className="dashboard-metric-value">
              {stats[metric.key]}
            </div>

            <div className="dashboard-metric-note">
              {metric.note}
            </div>
          </div>
        ))}
      </section>

      <div className="dashboard-section-heading">
        <h2>Management Modules</h2>
        <span>Institution-wide control</span>
      </div>

      <section className="dashboard-modules">
        {modules.map((module) => (
          <Link
            href={module.href}
            className={`dashboard-module dashboard-accent-${module.accent}`}
            key={module.href}
          >
            <div className="dashboard-module-number">
              {module.number}
            </div>

            <div className="dashboard-module-icon">
              <Icon type={module.icon} />
            </div>

            <h3>{module.title}</h3>

            <p>{module.description}</p>

            <div className="dashboard-module-arrow">
              Open module →
            </div>
          </Link>
        ))}
      </section>

      <section className="dashboard-footer-grid">
        <div className="dashboard-info-card">
          <h3>Institutional principle</h3>
          <p>
            ALMAFAAZ ACADEMY is being structured as a unified school management
            platform, with each operational department connected to a common
            institutional data layer.
          </p>
        </div>

        <div className="dashboard-info-card">
          <h3>System status</h3>
          <p>
            Authentication and database connectivity are handled through the
            configured Supabase project. Dashboard statistics shown above are
            retrieved from the live database.
          </p>
        </div>
      </section>

      <div className="dashboard-footer">
        ALMAFAAZ ACADEMY · Institutional Management System
      </div>
    </DashboardShell>
  );
}
