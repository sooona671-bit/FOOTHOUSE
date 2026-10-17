import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { useRouter } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const brandLogo = "/assets/brand-logo.png";

export const BRAND = "FOOT HOUSE";

export function Icon({ name, className, filled }: { name: string; className?: string; filled?: boolean }) {
  return (
    <span aria-hidden className={cn("material-symbols-outlined", filled && "filled", className)}>
      {name}
    </span>
  );
}

export const fhButton = cva(
  "inline-flex items-center justify-center gap-2 rounded-full transition-transform duration-100 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-sm hover:opacity-90",
        inverse: "bg-background text-foreground shadow-lg hover:opacity-90",
        outline: "border border-border bg-card text-foreground hover:bg-surface",
        soft: "bg-surface text-foreground hover:bg-surface-high",
        ghost: "text-muted-foreground hover:text-foreground",
      },
      size: {
        lg: "h-14 w-full text-label-lg",
        md: "h-12 px-5 text-label-md",
        icon: "h-14 w-14 shrink-0",
        sm: "h-9 px-4 text-label-md",
      },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  },
);

export const FhButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof fhButton>
>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(fhButton({ variant, size }), className)} {...props} />
));
FhButton.displayName = "FhButton";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: string;
  trailing?: React.ReactNode;
  error?: string;
};
export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ icon, trailing, error, className, ...props }, ref) => (
    <div>
      <div
        className={cn(
          "flex h-14 w-full items-center gap-3 rounded-2xl border border-transparent bg-surface px-4 transition-all focus-within:bg-background focus-within:ring-2 focus-within:ring-ring",
          error && "ring-2 ring-destructive",
        )}
      >
        {icon && <Icon name={icon} className="text-[20px] text-muted-foreground" />}
        <input
          ref={ref}
          className={cn(
            "w-full min-w-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-outline",
            className,
          )}
          {...props}
        />
        {trailing}
      </div>
      {error && <p className="mt-1.5 px-1 text-xs text-destructive">{error}</p>}
    </div>
  ),
);
Field.displayName = "Field";

export function PasswordField(props: Omit<FieldProps, "type" | "icon" | "trailing">) {
  const [show, setShow] = React.useState(false);
  return (
    <Field
      {...props}
      icon="lock"
      type={show ? "text" : "password"}
      trailing={
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((s) => !s)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Icon name={show ? "visibility" : "visibility_off"} className="text-[20px]" />
        </button>
      }
    />
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 cursor-pointer rounded-[6px] accent-primary"
      />
      <span className="text-label-md text-foreground">{label}</span>
    </label>
  );
}

export function ScreenHeader({ title, onBack, right, brand }: { title?: string; onBack?: () => void; right?: React.ReactNode; brand?: boolean }) {
  const router = useRouter();
  return (
    <div className="flex w-full items-center justify-between py-2">
      <button
        aria-label="Back"
        onClick={onBack ?? (() => router.history.back())}
        className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-surface"
      >
        <Icon name="arrow_back" className="text-[22px]" />
      </button>
      {brand ? (
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Monogram />
          {BRAND}
        </span>
      ) : (
        <span className="text-headline-sm font-bold tracking-tight text-foreground">{title}</span>
      )}
      <div className="flex w-10 justify-end">{right}</div>
    </div>
  );
}

export function Monogram({ size = "sm" }: { size?: "sm" | "lg" }) {
  return size === "lg" ? (
    <img src={brandLogo} alt="FOOT HOUSE" width={96} height={96} decoding="async" className="h-24 w-24 rounded-3xl object-contain shadow-2xl" />
  ) : (
    <img src={brandLogo} alt="FOOT HOUSE" width={28} height={28} decoding="async" className="h-7 w-7 rounded-lg object-contain" />
  );
}

export function Dots({ count, active }: { count: number; active: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={cn("h-1.5 rounded-full transition-all", i === active ? "w-6 bg-primary" : "w-1.5 bg-surface-high")}
        />
      ))}
    </div>
  );
}

export function OrDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function Screen({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("animate-screen flex min-h-full w-full flex-1 flex-col", className)}>{children}</section>;
}
