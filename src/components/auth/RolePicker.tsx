"use client";

import { useEffect, useRef, useState } from "react";
import { ROLES, RoleId } from "@/lib/roles";

type Props = {
  value: RoleId | "";
  onChange: (value: RoleId) => void;
  disabled?: boolean;
};

type IconName =
  | "super-admin"
  | "admin"
  | "teacher"
  | "staff"
  | "cbt"
  | "islamic"
  | "parent"
  | "student"
  | "default";

function getRoleIcon(title: string): IconName {
  const role = title.toLowerCase();

  if (role.includes("super")) return "super-admin";
  if (role.includes("administrator")) return "admin";
  if (role.includes("teacher")) return "teacher";
  if (role.includes("staff")) return "staff";
  if (role.includes("cbt")) return "cbt";
  if (role.includes("islamic")) return "islamic";
  if (role.includes("parent") || role.includes("guardian")) return "parent";
  if (role.includes("student")) return "student";

  return "default";
}

function RoleIcon({ name }: { name: IconName }) {
  const common = {
    width: 23,
    height: 23,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "super-admin":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
          <path d="m8 12 2.5 2.5L16 9" />
          <path d="m12 5 1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2L8.8 7.3 11 7l1-2Z" />
        </svg>
      );

    case "admin":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
          <circle cx="12" cy="11" r="3" />
          <path d="M12 8V6.5M12 15v1.5M9 11H7.5M16.5 11H15" />
        </svg>
      );

    case "teacher":
      return (
        <svg {...common}>
          <path d="m2 10 10-5 10 5-10 5-10-5Z" />
          <path d="M6 12v5c3.5 3 8.5 3 12 0v-5" />
          <path d="M22 10v6" />
        </svg>
      );

    case "staff":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M3 12h18M10 12v2h4v-2" />
        </svg>
      );

    case "cbt":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 16v5" />
          <path d="M7 7h2M11 7h2M15 7h2M7 11h2M11 11h2M15 11h2" />
        </svg>
      );

    case "islamic":
      return (
        <svg {...common}>
          <path d="M12 7v14" />
          <path d="M12 7C9 4.5 5.5 4 3 5v14c3-1 6.5-.5 9 2" />
          <path d="M12 7c3-2.5 6.5-3 9-2v14c-3-1-6.5-.5-9 2" />
          <path d="M6 9h3M6 12h3M15 9h3M15 12h3" />
        </svg>
      );

    case "parent":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20v-1.5A5.5 5.5 0 0 1 8 13h2a5.5 5.5 0 0 1 5.5 5.5V20" />
          <path d="M16 4.8a3.5 3.5 0 0 1 0 6.5M18 14a5 5 0 0 1 3.5 4.8V20" />
        </svg>
      );

    case "student":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 21v-1.5a7 7 0 0 1 14 0V21" />
          <path d="m3 5 9-3 9 3-9 3-9-3Z" />
          <path d="M20 6v5" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </svg>
      );
  }
}

export default function RolePicker({
  value,
  onChange,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = ROLES.find((role) => role.id === value);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="role-picker" ref={wrapperRef}>
      <button
        type="button"
        className={`role-trigger ${open ? "role-trigger-open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="role-trigger-icon">
          <RoleIcon
            name={selected ? getRoleIcon(selected.title) : "default"}
          />
        </span>

        <span className="role-trigger-copy">
          <span className="role-trigger-label">
            {selected ? selected.title : "Select your role"}
          </span>
          <span className="role-trigger-hint">
            {selected
              ? "Your selected account type"
              : "Choose your academy account type"}
          </span>
        </span>

        <svg
          className={`chevron ${open ? "chevron-up" : ""}`}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="role-popover"
          role="listbox"
          aria-label="Account roles"
        >
          <div className="role-popover-heading">
            <span>Choose your account</span>
            <span className="role-count">{ROLES.length} roles</span>
          </div>

          <div className="role-options">
            {ROLES.map((role) => {
              const isSelected = value === role.id;

              return (
                <button
                  type="button"
                  key={role.id}
                  role="option"
                  aria-selected={isSelected}
                  className={`role-option ${
                    isSelected ? "role-option-selected" : ""
                  }`}
                  onClick={() => {
                    onChange(role.id);
                    setOpen(false);
                  }}
                >
                  <span
                    className={`role-avatar role-avatar-${role.color}`}
                  >
                    <RoleIcon name={getRoleIcon(role.title)} />
                  </span>

                  <span className="role-option-copy">
                    <span className="role-option-title">
                      {role.title}
                    </span>
                    <span className="role-option-description">
                      {role.description}
                    </span>
                  </span>

                  {isSelected && (
                    <svg
                      className="selected-check"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className="role-popover-footer">
            Select the role assigned to your account.
          </div>
        </div>
      )}
    </div>
  );
}
