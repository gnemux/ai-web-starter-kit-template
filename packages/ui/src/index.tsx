import { cloneElement, isValidElement, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
export { Dialog } from "./dialog";
export { Toast } from "./toast";

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
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className={controlClass("ui-textarea", className)} />; }
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className={controlClass("ui-select", className)} />; }
export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={controlClass("ui-checkbox", className)} type="checkbox" />; }
export function Notice({ children, variant = "info" }: { children: ReactNode; variant?: "info" | "success" | "warning" | "error" }) { return <div className={`notice notice-${variant}`} role={variant === "error" ? "alert" : "status"}>{children}</div>; }
export function NavTabs({ children, label }: { children: ReactNode; label: string }) { return <nav aria-label={label} className="tabs">{children}</nav>; }
export const Tabs = NavTabs;
export function Popover({ summary, children }: { summary: string; children: ReactNode }) { return <details className="popover"><summary>{summary}</summary><div>{children}</div></details>; }
export function Skeleton({ label }: { label: string }) { return <div aria-label={label} className="skeleton" role="status"><span /><span /><span /></div>; }
export function StatePanel({ kind, kindLabel, title, description }: { kind: "loading" | "empty" | "error" | "forbidden" | "disabled"; kindLabel?: string; title: string; description: string }) { return <Card><Badge>{kindLabel ?? kind}</Badge><h2>{title}</h2><p>{description}</p>{kind === "loading" ? <Skeleton label={kindLabel ?? title} /> : null}</Card>; }
export const Panel = Card;
export function SectionHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) { return <header className="section-header"><div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{action ? <div>{action}</div> : null}</header>; }
export function ProgressBar({ value, label }: { value: number; label: string }) { const bounded = Math.max(0, Math.min(100, value)); return <div aria-label={label} aria-valuemax={100} aria-valuemin={0} aria-valuenow={bounded} className="progress" role="progressbar"><span style={{ width: `${bounded}%` }} /></div>; }
export function EmptyState(props: { title: string; description: string }) { return <StatePanel kind="empty" {...props} />; }
export function LoadingState({ title, description }: { title: string; description: string }) { return <StatePanel kind="loading" title={title} description={description} />; }
export function ErrorState(props: { title: string; description: string }) { return <StatePanel kind="error" {...props} />; }
export function LongContent({ label, children }: { label: string; children: ReactNode }) { return <Card className="long-content"><p className="eyebrow">{label}</p><div>{children}</div></Card>; }
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`ui-container ${className}`}>{children}</div>; }
export function Stack({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`ui-stack ${className}`}>{children}</div>; }
export function Grid({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`ui-grid ${className}`}>{children}</div>; }
