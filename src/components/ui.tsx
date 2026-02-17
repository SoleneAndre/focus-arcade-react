import type { PropsWithChildren, HTMLAttributes, ButtonHTMLAttributes } from "react";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white border border-slate-200 shadow-sm",
        "p-5 md:p-6",
        className
      )}
      {...props}
    />
  );
}

export function H1({ children }: PropsWithChildren) {
  return <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">{children}</h1>;
}

export function H2({ children }: PropsWithChildren) {
  return <h2 className="text-lg font-semibold text-slate-900">{children}</h2>;
}

export function P({ children }: PropsWithChildren) {
  return <p className="text-sm text-slate-600 leading-relaxed">{children}</p>;
}

export function Pill({ children }: PropsWithChildren) {
  return (
    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {children}
    </span>
  );
}

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "rounded-2xl px-4 py-2.5 font-semibold",
        "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-900/90",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}

export function ButtonGhost({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "rounded-2xl px-4 py-2.5 font-semibold",
        "bg-white hover:bg-slate-50 border border-slate-200 text-slate-800",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4 md:p-5">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </Card>
  );
}
