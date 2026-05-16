import React from "react";
import { IconCheck, IconChevronRight } from "./icons";

export const Card = ({
  className,
  style,
  children
}: React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>) => (
  <div className={["card", className].filter(Boolean).join(" ")} style={style}>
    {children}
  </div>
);

export const IconButton = ({
  onClick,
  title,
  disabled,
  style,
  children
}: React.PropsWithChildren<{ 
  onClick?: () => void; 
  title?: string; 
  disabled?: boolean;
  style?: React.CSSProperties;
}>) => (
  <button 
    className="iconBtn" 
    onClick={onClick} 
    title={title} 
    type="button"
    disabled={disabled}
    style={style}
  >
    {children}
  </button>
);

export const PillButton = ({
  onClick,
  children,
  disabled,
  variant = "primary"
}: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean; variant?: "primary" | "secondary" }>) => (
  <button
    className={["pillBtn", variant === "secondary" ? "secondary" : ""].filter(Boolean).join(" ")}
    onClick={onClick}
    disabled={disabled}
    type="button"
  >
    {children}
  </button>
);

export const Switch = ({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) => (
  <button
    role="switch"
    aria-checked={checked}
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onChange(!checked);
    }}
    style={{
      width: 52,
      height: 32,
      borderRadius: 999,
      border: 0,
      cursor: "pointer",
      background: checked ? "var(--color-primary)" : "var(--color-surface-container-highest)",
      position: "relative",
      padding: 0
    }}
  >
    <span
      style={{
        width: 24,
        height: 24,
        borderRadius: 999,
        background: checked ? "var(--color-on-primary)" : "var(--color-outline)",
        position: "absolute",
        top: "50%",
        left: checked ? "calc(100% - 28px)" : 4,
        transform: "translateY(-50%)",
        transition: "left 180ms ease, background 180ms ease"
      }}
    />
  </button>
);

export function ListItem({
  title,
  subtitle,
  icon,
  action,
  onClick,
  isNav
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  isNav?: boolean;
}) {
  return (
    <div className={["listItem", onClick ? "clickable" : ""].filter(Boolean).join(" ")} onClick={onClick}>
      <div className="listLead">
        {icon ? <div className="listIcon">{icon}</div> : null}
        <div className="listTexts">
          <div className="listTitle">{title}</div>
          {subtitle ? <div className="listSubtitle">{subtitle}</div> : null}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {action}
        {isNav ? <IconChevronRight size={18} /> : null}
      </div>
    </div>
  );
}

export function Segmented({
  options,
  value,
  onChange
}: {
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        borderRadius: 999,
        background: "var(--color-surface-container-highest)",
        padding: 4,
        height: 44
      }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex: "1 1 0",
              borderRadius: 999,
              border: 0,
              cursor: "pointer",
              background: selected ? "var(--color-surface)" : "transparent",
              color: selected ? "var(--color-on-surface)" : "var(--color-on-surface-variant)",
              boxShadow: selected ? "var(--shadow-1)" : "none",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "0 10px"
            }}
          >
            {selected ? <IconCheck size={16} /> : opt.icon ? <span style={{ opacity: 0.75 }}>{opt.icon}</span> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Dropdown({
  options,
  value,
  onChange
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => {
        e.stopPropagation();
        onChange(e.target.value);
      }}
      onClick={(e) => e.stopPropagation()}
      style={{
        height: 36,
        borderRadius: 10,
        border: "1px solid var(--color-outline-variant)",
        background: "var(--color-surface-container-highest)",
        color: "var(--color-on-surface)",
        padding: "0 10px",
        fontWeight: 600,
        cursor: "pointer",
        maxWidth: 180
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
