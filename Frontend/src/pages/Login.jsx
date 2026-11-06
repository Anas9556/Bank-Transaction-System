import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import FormInput from "../components/FormInput.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import { loginUser } from "../services/authService.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setAuthError("");
    setNotice("");
  }

  function validate() {
    const nextErrors = {};
    if (!form.email.trim()) {
      nextErrors.email = "Email address is required";
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!form.password) {
      nextErrors.password = "Password is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setAuthError("");
    setNotice("");

    try {
      const result = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });
      setNotice(result?.user ? "Authentication accepted. Opening your workspace." : "Authentication accepted.");
      setTimeout(() => navigate(result?.user?.systemUser ? "/system" : "/dashboard"), 350);
    } catch (error) {
      setAuthError(error.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout mode="login">
      <div className="auth-card login-card">
        <div className="card-accent" />

        <div className="card-heading">
          <h2>Welcome back</h2>
          <p>Sign in to access your financial workspace.</p>
        </div>

        {authError ? (
          <div className="alert error-alert" role="alert">
            <span className="material-symbols-outlined" aria-hidden="true">error</span>
            <div>
              <b>Sign-in failed</b>
              <span>{authError}</span>
            </div>
          </div>
        ) : null}

        {notice ? (
          <div className="alert success-alert" role="status">
            <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
            <div>
              <b>Access Granted</b>
              <span>{notice}</span>
            </div>
          </div>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <FormInput
            id="email"
            name="email"
            label="Email address"
            icon="mail"
            type="email"
            placeholder="alex.chen@acmecorp.io"
            autoComplete="email"
            value={form.email}
            error={errors.email}
            onChange={updateField}
          />

          <PasswordInput
            id="password"
            name="password"
            label="Password"
            icon="key"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={form.password}
            error={errors.password}
            onChange={updateField}
            endLabel={<span className="micro-link" title="Password recovery is not available in the current backend">Password reset unavailable</span>}
          />

          <div className="form-row">
            <span className="secure-chip">Session-managed cookie</span>
            <span className="secure-chip">JWT authentication</span>
          </div>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner" aria-hidden="true" /> : null}
            <span>{isSubmitting ? "Verifying signature..." : "Sign in"}</span>
          </button>
        </form>

        <p className="switch-copy">
          Don't have an institutional account?
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
