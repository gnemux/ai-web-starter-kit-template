import type { ReactNode, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { title?: string };

function Icon({ children, title, ...props }: IconProps & { children: ReactNode }) {
  return <svg {...props} aria-hidden={title ? undefined : true} className={["ui-icon", props.className].filter(Boolean).join(" ")} fill="none" focusable="false" role={title ? "img" : undefined} viewBox="0 0 24 24">
    {title ? <title>{title}</title> : null}
    {children}
  </svg>;
}

const stroke = { stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 2 };

export function CloseIcon(props: IconProps) { return <Icon {...props}><path {...stroke} d="m6 6 12 12M18 6 6 18" /></Icon>; }
export function ChevronDownIcon(props: IconProps) { return <Icon {...props}><path {...stroke} d="m7 10 5 5 5-5" /></Icon>; }
export function CheckIcon(props: IconProps) { return <Icon {...props}><path {...stroke} d="m5 12 4 4L19 6" /></Icon>; }
export function InfoIcon(props: IconProps) { return <Icon {...props}><circle {...stroke} cx="12" cy="12" r="9" /><path {...stroke} d="M12 11v5M12 8h.01" /></Icon>; }
export function WarningIcon(props: IconProps) { return <Icon {...props}><path {...stroke} d="M12 3 2.8 20h18.4L12 3Z" /><path {...stroke} d="M12 9v5M12 17h.01" /></Icon>; }
