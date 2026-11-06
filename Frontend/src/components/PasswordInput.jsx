import { useState } from "react";

export default function PasswordInput({
  id,
  label,
  icon = "lock",
  error,
  endLabel,
  className = "",
  labelClassName = "",
  ...props
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`field ${className}`}>
      <div className="field-label-row">
        <label className={`field-label ${labelClassName}`} htmlFor={id}>
          {label}
        </label>
        {endLabel}
      </div>
      <div className={`input-shell ${error ? "input-error" : ""}`}>
        <span className="material-symbols-outlined input-icon" aria-hidden="true">
          {icon}
        </span>
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        <button
          className="input-action"
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((value) => !value)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {visible ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          <span className="material-symbols-outlined" aria-hidden="true">info</span>
          {error}
        </p>
      ) : null}
    </div>
  );
}
