import { cloneElement, isValidElement, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { CheckIcon, ChevronDownIcon, InfoIcon, WarningIcon } from "./icons";
export { Dialog } from "./dialog";
export { Toast } from "./toast";
export { CheckIcon, ChevronDownIcon, CloseIcon, InfoIcon, WarningIcon } from "./icons";

export function BrandMark({ mark, name }: { mark: string; name: string }) { return <span className="brand"><span className="brand-mark" aria-hidden>{mark}</span><span>{name}</span></span>; }
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "small" | "medium" | "large";
export function Button({ type = "button", variant = "primary", size = "medium", loading = false, loadingLabel, leadingIcon, className = "", children, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; loadingLabel?: string; leadingIcon?: ReactNode }) {
  return <button {...props} aria-busy={loading || undefined} type={type} disabled={disabled || loading} className={`button button-${variant} button-${size} ${className}`}>
    {loading ? <span aria-hidden className="button-spinner" /> : leadingIcon ? <span aria-hidden className="button-icon">{leadingIcon}</span> : null}
    <span>{loading && loadingLabel ? loadingLabel : children}</span>
  </button>;
}
export function Badge({ children, variant = "neutral" }: { children: ReactNode; variant?: "neutral" | "info" | "success" | "warning" | "error" }) { return <span className={`badge badge-${variant}`}>{children}</span>; }
export function Card({ children, className = "", variant = "elevated" }: { children: ReactNode; className?: string; variant?: "elevated" | "outlined" | "subtle" }) { return <section className={`card card-${variant} ${className}`}>{children}</section>; }
export function PageHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) { return <header className="page-header">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p>{description}</p>}</header>; }
export function FormField({ id, label, hint, error, children }: { id?: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  const describedBy = id ? [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") : "";
  const control = id && isValidElement<{ id?: string; "aria-describedby"?: string }>(children)
    ? cloneElement(children, { id: children.props.id ?? id, "aria-describedby": [children.props["aria-describedby"], describedBy].filter(Boolean).join(" ") || undefined })
    : children;
  return <label className="field" htmlFor={id}><span>{label}</span>{control}{hint && <small id={id ? `${id}-hint` : undefined}>{hint}</small>}{error && <small className="field-error" id={id ? `${id}-error` : undefined} role="alert">{error}</small>}</label>;
}
const controlClass = (base: string, className?: string) => [base, className].filter(Boolean).join(" ");
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={controlClass("ui-input", className)} />; }
export function Notice({ children, variant = "info" }: { children: ReactNode; variant?: "info" | "success" | "warning" | "error" }) {
  const StatusIcon = variant === "success" ? CheckIcon : variant === "warning" || variant === "error" ? WarningIcon : InfoIcon;
  return <div className={`notice notice-${variant}`} role={variant === "error" ? "alert" : "status"}><StatusIcon /><span>{children}</span></div>;
}
export function NavTabs({ children, label }: { children: ReactNode; label: string }) { return <nav aria-label={label} className="tabs">{children}</nav>; }
export function Disclosure({ summary, children }: { summary: string; children: ReactNode }) { return <details className="disclosure"><summary><span>{summary}</span><ChevronDownIcon /></summary><div>{children}</div></details>; }
export function Skeleton({ label }: { label: string }) { return <div aria-label={label} className="skeleton" role="status"><span /><span /><span /></div>; }
export function StatePanel({ kind, kindLabel, title, description }: { kind: "loading" | "empty" | "error" | "forbidden" | "disabled"; kindLabel?: string; title: string; description: string }) { return <Card><Badge>{kindLabel ?? kind}</Badge><h2>{title}</h2><p>{description}</p>{kind === "loading" ? <Skeleton label={kindLabel ?? title} /> : null}</Card>; }
export function SectionHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) { return <header className="section-header"><div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{action ? <div>{action}</div> : null}</header>; }
