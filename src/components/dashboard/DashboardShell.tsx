"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type IconName =
  | "home"
  | "activity"
  | "people"
  | "academic"
  | "cbt"
  | "report"
  | "finance"
  | "visitor"
  | "message"
  | "security"
  | "settings"
  | "chevron"
  | "search"
  | "refresh"
  | "bell"
  | "sun"
  | "moon"
  | "logout"
  | "menu"
  | "close";

const icons: Record<IconName, ReactNode> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V5M4 15h4l2-8 3 12 2-7h5" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c.5-3.2 2.2-5 5.5-5s5 1.8 5.5 5M16 11a3 3 0 1 0 0-6M16 15c2.8 0 4.2 1.7 4.7 5" />
    </svg>
  ),
  academic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m3 9 9-5 9 5-9 5-9-5Z" />
      <path d="M7 11.5V16c3 2 7 2 10 0v-4.5M21 10v6" />
    </svg>
  ),
  cbt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h2M15 8h2M7 12h2M15 12h2M7 16h10" />
    </svg>
  ),
  report: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5M8 13h8M8 17h6M8 9h3" />
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M15 9.5c-.7-1-1.7-1.5-3-1.5-1.7 0-3 1-3 2.3 0 3.2 6 1.3 6 4.4 0 1.3-1.3 2.3-3 2.3-1.4 0-2.5-.5-3.2-1.5" />
    </svg>
  ),
  visitor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20v-2a6 6 0 0 1 12 0v2M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 8h4M19 6v4" />
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5h16v11H8l-4 4V5Z" />
      <path d="M8 9h8M8 12h5" />
    </svg>
  ),
  security: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 20 6v6c0 5-3.2 8-8 9-4.8-1-8-4-8-9V6l8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      <path d="M4.9 4.9 7 7M17 17l2.1 2.1M3 12h3M18 12h3M4.9 19.1 7 17M17 7l2.1-2.1M12 3v3M12 18v3" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3" />
      <path d="M5 4v4h4M19 20v-4h-4" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ),
};

type ChildItem = {
  label: string;
  href: string;
};

type Group = {
  label: string;
  icon: IconName;
  children: ChildItem[];
};

const groups: Group[] = [
  {
    label: "People & HR",
    icon: "people",
    children: [
      { label: "Overview", href: "/super-admin/people" },
      { label: "Super Administrators", href: "/super-admin/people/super-admins" },
      { label: "Administrators", href: "/super-admin/people/administrators" },
      { label: "Teachers", href: "/super-admin/people/teachers" },
      { label: "Staff", href: "/super-admin/people/staff" },
      { label: "CBT Officers", href: "/super-admin/people/cbt-officers" },
      { label: "Islamic Section", href: "/super-admin/people/islamic-section" },
      { label: "Parents", href: "/super-admin/people/parents" },
      { label: "Students", href: "/super-admin/people/students" },
    ],
  },
  {
    label: "Academics",
    icon: "academic",
    children: [
      { label: "Sessions", href: "/super-admin/academics/sessions" },
      { label: "Classes", href: "/super-admin/academics/classes" },
      { label: "Subjects", href: "/super-admin/academics/subjects" },
      { label: "Schemes of Work", href: "/super-admin/academics/schemes" },
      { label: "Lesson Plans", href: "/super-admin/academics/lesson-plans" },
      { label: "Timetables", href: "/super-admin/academics/timetables" },
    ],
  },
  {
    label: "CBT & Examinations",
    icon: "cbt",
    children: [
      { label: "Examinations", href: "/super-admin/cbt/examinations" },
      { label: "Question Bank", href: "/super-admin/cbt/questions" },
      { label: "CBT Management", href: "/super-admin/cbt/management" },
      { label: "Results", href: "/super-admin/cbt/results" },
    ],
  },
  {
    label: "Reports & Intelligence",
    icon: "report",
    children: [
      { label: "Student Reports", href: "/super-admin/reports/students" },
      { label: "Academic Reports", href: "/super-admin/reports/academic" },
      { label: "Performance", href: "/super-admin/reports/performance" },
    ],
  },
  {
    label: "Finance",
    icon: "finance",
    children: [
      { label: "Finance Overview", href: "/super-admin/finance" },
      { label: "Fees", href: "/super-admin/finance/fees" },
      { label: "Payments", href: "/super-admin/finance/payments" },
      { label: "Financial Reports", href: "/super-admin/finance/reports" },
    ],
  },
  {
    label: "Visitors & Security",
    icon: "visitor",
    children: [
      { label: "Visitors", href: "/super-admin/visitors" },
      { label: "Visitor History", href: "/super-admin/visitors/history" },
    ],
  },
];

const systemItems: ChildItem[] = [
  { label: "Messages", href: "/super-admin/messages" },
  { label: "Security & Audit", href: "/super-admin/security" },
  { label: "Settings", href: "/super-admin/settings" },
];

function NavLink({
  item,
  active,
  onClick,
}: {
  item: ChildItem;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`dashboard-nav-link${active ? " active" : ""}`}
    >
      <span className="dashboard-nav-link-dot" />
      <span>{item.label}</span>
    </Link>
  );
}

export default function DashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo(
    () => [...groups.flatMap((g) => g.children), ...systemItems],
    [],
  );

  const activeItem = allItems.find((item) => pathname === item.href);

  useEffect(() => {
    const activeGroup = groups.find((group) =>
      group.children.some((item) => pathname === item.href),
    );

    if (activeGroup) {
      setOpenGroup(activeGroup.label);
    }
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      setTime(
        new Intl.DateTimeFormat("en-NG", {
          timeZone: "Africa/Lagos",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(now),
      );

      setDate(
        new Intl.DateTimeFormat("en-NG", {
          timeZone: "Africa/Lagos",
          weekday: "long",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(now),
      );
    };

    updateClock();
    const timer = window.setInterval(updateClock, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const closeProfile = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", closeProfile);

    return () => document.removeEventListener("mousedown", closeProfile);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const searchResults =
    search.trim().length > 1
      ? allItems
          .filter((item) =>
            item.label.toLowerCase().includes(search.toLowerCase()),
          )
          .slice(0, 6)
      : [];

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <div className={`dashboard-shell${collapsed ? " sidebar-collapsed" : ""}`}>
      <aside
        className={`dashboard-sidebar${
          mobileOpen ? " mobile-sidebar-open" : ""
        }`}
      >
        <div className="dashboard-sidebar-brand">
          <img src="/almafaaz-logo.png" alt="ALMAFAAZ ACADEMY" />

          <div className="dashboard-brand-copy">
            <div className="dashboard-brand-title">ALMAFAAZ ACADEMY</div>
            <div className="dashboard-brand-subtitle">
              Management System
            </div>
          </div>

          <button
            className="dashboard-sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            {icons.close}
          </button>
        </div>

        <div className="dashboard-sidebar-scroll">
          <div className="dashboard-nav-label">Workspace</div>

          <NavLink
            item={{ label: "Overview", href: "/super-admin" }}
            active={pathname === "/super-admin"}
          />

          <NavLink
            item={{ label: "Activity Centre", href: "/super-admin/activity" }}
            active={pathname === "/super-admin/activity"}
          />

          <div className="dashboard-nav-label" style={{ marginTop: 18 }}>
            Management
          </div>

          {groups.map((group) => {
            const isOpen = openGroup === group.label;
            const groupActive = group.children.some(
              (item) => pathname === item.href,
            );

            return (
              <div className="dashboard-nav-group" key={group.label}>
                <button
                  className={`dashboard-nav-group-button${
                    groupActive ? " active-parent" : ""
                  }`}
                  onClick={() =>
                    setOpenGroup((current) =>
                      current === group.label ? null : group.label,
                    )
                  }
                >
                  <span className="dashboard-nav-icon">
                    {icons[group.icon]}
                  </span>

                  <span className="dashboard-nav-text">{group.label}</span>

                  <span
                    className={`dashboard-nav-chevron${
                      isOpen ? " open" : ""
                    }`}
                  >
                    {icons.chevron}
                  </span>
                </button>

                {isOpen && (
                  <div className="dashboard-nav-children">
                    {group.children.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        active={pathname === item.href}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="dashboard-nav-label" style={{ marginTop: 18 }}>
            System
          </div>

          {systemItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href}
            />
          ))}
        </div>

        <div className="dashboard-sidebar-footer">
          <div className="dashboard-status">
            <span className="dashboard-status-dot" />
            <span>System operational</span>
          </div>

          <button
            className="dashboard-collapse"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? "Expand navigation" : "Collapse navigation"}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="dashboard-mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            className="dashboard-mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            {icons.menu}
          </button>

          <div className="dashboard-page-context">
            <small>Control Centre</small>
            <strong>{activeItem?.label ?? "Overview"}</strong>
          </div>

          <div className="dashboard-search">
            <span className="dashboard-search-icon">
              {icons.search}
            </span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search modules, people and records..."
              aria-label="Search dashboard"
            />

            {searchResults.length > 0 && (
              <div className="dashboard-profile-menu" style={{ top: 48, left: 0, right: "auto", width: "100%" }}>
                {searchResults.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="dashboard-profile-menu-item"
                    onClick={() => setSearch("")}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-topbar-spacer" />

          <div className="dashboard-time">
            <strong>{time}</strong>
            <span>{date}</span>
          </div>

          <button
            className="dashboard-icon-button"
            onClick={() => window.location.reload()}
            aria-label="Refresh"
            title="Refresh"
          >
            {icons.refresh}
          </button>

          <button
            className="dashboard-icon-button"
            aria-label="Notifications"
            title="Notifications"
          >
            {icons.bell}
          </button>

          <div className="dashboard-profile-wrap" ref={profileRef}>
            <button
              className="dashboard-profile-button"
              onClick={() => setProfileOpen((value) => !value)}
            >
              <span className="dashboard-profile-avatar">SA</span>

              <span className="dashboard-profile-copy">
                <strong>Super Administrator</strong>
                <span>System Control</span>
              </span>
            </button>

            {profileOpen && (
              <div className="dashboard-profile-menu">
                <Link
                  href="/super-admin/settings"
                  className="dashboard-profile-menu-item"
                >
                  {icons.settings}
                  Settings
                </Link>

                <button
                  className="dashboard-profile-menu-item danger"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {icons.logout}
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
