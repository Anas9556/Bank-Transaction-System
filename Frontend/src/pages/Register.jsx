import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import FormInput from "../components/FormInput.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import { registerUser } from "../services/authService.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordRules = [
  { key: "length", label: "8+ characters", test: (value) => value.length >= 8 },
  { key: "number", label: "1+ number", test: (value) => /\d/.test(value) },
  { key: "upper", label: "1+ uppercase", test: (value) => /[A-Z]/.test(value) },
  { key: "symbol", label: "1+ symbol", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = useMemo(() => {
    const score = passwordRules.reduce((total, rule) => total + (rule.test(form.password) ? 1 : 0), 0);
    const labels = ["None", "Weak", "Fair", "Strong", "Optimal"];
    return { score, label: form.password ? labels[score] : "None" };
  }, [form.password]);

  const passwordsMatch = form.confirmPassword && form.password === form.confirmPassword;

  function updateField(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setStatus({ type: "", message: "" });
  }

  function validate() {
    const nextErrors = {};
    if (!form.name.trim()) {
      nextErrors.name = "Full name is required";
    }
    if (!form.email.trim()) {
      nextErrors.email = "Email address is required";
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }
    if (!form.password) {
      nextErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    if (!form.terms) {
      nextErrors.terms = "Terms acceptance is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setStatus({ type: "success", message: result?.user ? "Registration successful. Opening your workspace." : "Registration successful." });
      setTimeout(() => navigate("/dashboard"), 500);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Unable to create account. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout mode="register">
      <div className="register-shell">
        <div className="auth-card register-card">
          {status.message ? (
            <div className={`alert ${status.type === "success" ? "success-alert" : "error-alert"}`} role={status.type === "success" ? "status" : "alert"}>
              <span className="material-symbols-outlined" aria-hidden="true">{status.type === "success" ? "check_circle" : "error"}</span>
              <div>
                <b>{status.title || (status.type === "success" ? "Registration Successful" : "Registration Halted")}</b>
                <span>{status.message}</span>
              </div>
            </div>
          ) : null}

          <div className="card-heading register-heading">
            <h2>Create your account</h2>
            <p>Get started with your personal financial workspace.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <FormInput
              id="name"
              name="name"
              label="Full Name"
              icon="person"
              type="text"
              placeholder="Alex Chen"
              autoComplete="name"
              value={form.name}
              error={errors.name}
              onChange={updateField}
            />

            <FormInput
              id="register-email"
              name="email"
              label="Work Email Address"
              icon="mail"
              type="email"
              placeholder="alex.chen@acmecorp.io"
              autoComplete="email"
              value={form.email}
              error={errors.email}
              onChange={updateField}
            />

            <PasswordInput
              id="register-password"
              name="password"
              label="Password"
              placeholder="Enter strong passphrase"
              autoComplete="new-password"
              value={form.password}
              error={errors.password}
              onChange={updateField}
            />

            <div className="strength-box" aria-live="polite">
              <div className="strength-head">
                <span>Passphrase Complexity</span>
                <strong className={`strength-${strength.score}`}>{strength.label}</strong>
              </div>
              <div className="strength-bars" aria-hidden="true">
                {[1, 2, 3, 4].map((level) => (
                  <span key={level} className={strength.score >= level ? `filled score-${strength.score}` : ""} />
                ))}
              </div>
              <div className="rule-grid">
                {passwordRules.map((rule) => {
                  const met = rule.test(form.password);
                  return (
                    <span key={rule.key} className={met ? "met" : ""}>
                      <span className="material-symbols-outlined" aria-hidden="true">{met ? "check_circle" : "radio_button_unchecked"}</span>
                      {rule.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <PasswordInput
              id="confirm-password"
              name="confirmPassword"
              label="Confirm Password"
              icon="verified_user"
              placeholder="Repeat passphrase"
              autoComplete="new-password"
              value={form.confirmPassword}
              error={errors.confirmPassword}
              onChange={updateField}
              endLabel={
                form.confirmPassword ? (
                  <span className={passwordsMatch ? "match-label valid" : "match-label invalid"}>
                    {passwordsMatch ? "Match Verified" : "Mismatch"}
                  </span>
                ) : null
              }
            />

            <div className="terms-block">
              <label className="checkbox-label terms-label">
                <input name="terms" checked={form.terms} type="checkbox" onChange={updateField} />
                <span>I agree to the Terms of Service and Privacy Policy.</span>
              </label>
              {errors.terms ? <p className="field-error terms-error">{errors.terms}</p> : null}
            </div>

            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <span className="spinner" aria-hidden="true" /> : <span>Create account</span>}
              <span>{isSubmitting ? "Creating account..." : ""}</span>
              {!isSubmitting ? <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span> : null}
            </button>
          </form>

          <p className="switch-copy">
            Already have an account?
            <Link to="/login">Sign in <span className="material-symbols-outlined" aria-hidden="true">arrow_outward</span></Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
