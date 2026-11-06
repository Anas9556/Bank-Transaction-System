export default function FormInput({
  id,
  label,
  icon,
  error,
  className = "",
  labelClassName = "",
  ...props
}) {
  return (
    <div className={`field ${className}`}>
      <label className={`field-label ${labelClassName}`} htmlFor={id}>
        {label}
      </label>
      <div className={`input-shell ${error ? "input-error" : ""}`}>
        <span className="material-symbols-outlined input-icon" aria-hidden="true">
          {icon}
        </span>
        <input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} />
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
