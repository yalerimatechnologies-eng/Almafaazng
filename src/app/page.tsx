import BrandHeader from "@/components/auth/BrandHeader";
import LoginForm from "@/components/auth/LoginForm";

export default function Home() {
  return (
    <main className="login-page">
      <div className="ambient ambient-orange" aria-hidden="true" />
      <div className="ambient ambient-blue" aria-hidden="true" />
      <div className="page-grid" aria-hidden="true" />

      <section className="login-shell">
        <BrandHeader />

        <div className="login-card">
          <div className="card-topline" />

          <div className="card-heading">
            <span className="welcome-eyebrow">WELCOME BACK</span>
            <h1>Sign in to your account</h1>
            <p>
              Enter your account details to access your academy portal.
            </p>
          </div>

          <LoginForm />

          <div className="card-bottom">
            <span className="bottom-rule" />
            <span>ALMAFAAZ ACADEMY</span>
            <span className="bottom-rule" />
          </div>
        </div>

        <footer className="page-footer">
          <span>© {new Date().getFullYear()} ALMAFAAZ ACADEMY</span>
          <span className="footer-separator">•</span>
          <span>Secure academic access</span>
        </footer>
      </section>
    </main>
  );
}
