"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import RolePicker from "./RolePicker";
import { getRole, RoleId } from "@/lib/roles";
import { supabase } from "@/lib/supabase";
import { resolveCurrentAccount } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();

  const [role, setRole] = useState<RoleId | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!role) {
      setError("Please select your account role.");
      return;
    }

    if (!email.trim() || !password) {
      setError("Enter your email address and password to continue.");
      return;
    }

    if (!supabase) {
      setError(
        "Authentication is not configured. Add your Supabase URL and public key to .env.local, then restart the application."
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError || !data.user) {
        setError("The email or password is incorrect. Please try again.");
        return;
      }

      const resolution = await resolveCurrentAccount(
        data.user.id,
        data.user.email ?? null
      );

      if (!resolution.ok) {
        await supabase.auth.signOut();
        setError(resolution.message);
        return;
      }

      const assignedRole = resolution.account.role;

      if (assignedRole !== role) {
        await supabase.auth.signOut();
        setError(
          `This account is registered as ${getRole(assignedRole)?.title ?? assignedRole}. Select the correct role and try again.`
        );
        return;
      }

      setSuccess("Authentication successful. Preparing your account…");

      /*
       * Session persistence is governed by the Supabase client configuration.
       * The `remember` toggle is captured in state for future use.
       */
      const destinations: Record<RoleId, string> = {
        super_admin: "/super-admin",
        admin: "/admin",
        teacher: "/teacher",
        staff: "/staff",
        cbt_officer: "/cbt",
        islamic_section: "/islamic-section",
        parent: "/parent",
        student: "/student",
      };

      router.push(destinations[role]);
      router.refresh();
    } catch {
      setError(
        "We could not complete sign-in. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="field-group">
        <label className="field-label" htmlFor="account-role">
          Account role
        </label>
        <RolePicker
          value={role}
          onChange={setRole}
          disabled={loading}
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="email">
          Email address
        </label>
        <div className="input-wrap">
          <svg className="input-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="Enter your registered email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
            required
          />
        </div>
      </div>

      <div className="field-group">
        <div className="password-label-row">
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <a className="text-link" href="/forgot-password">
            Forgot password?
          </a>
        </div>

        <div className="input-wrap">
          <svg className="input-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
            required
          />
          <button
            className="password-toggle"
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={loading}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 3 21 21M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9 7 9 7a15 15 0 0 1-3.1 3.8M6.2 6.2C4.1 7.5 3 12 3 12s3.5 7 9 7a9.8 9.8 0 0 0 3.2-.5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <label className="remember-row">
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
          disabled={loading}
        />
        <span className="custom-checkbox" aria-hidden="true" />
        <span>Keep me signed in</span>
      </label>

      {error && (
        <div className="form-message form-error" role="alert">
          <span className="message-symbol">!</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="form-message form-success" role="status">
          <span className="message-symbol">✓</span>
          <span>{success}</span>
        </div>
      )}

      <button
        className={`submit-button ${loading ? "submit-loading" : ""}`}
        type="submit"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="button-spinner" />
            Verifying account…
          </>
        ) : (
          <>
            Sign in to your account
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </>
        )}
      </button>

      <p className="form-footnote">
        Access is restricted to authorised ALMAFAAZ ACADEMY accounts.
      </p>
    </form>
  );
}
