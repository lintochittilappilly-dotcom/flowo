interface PasswordStrengthBarProps {
  password: string;
}

const getStrength = (pw: string): { level: number; label: string; color: string } => {
  if (!pw) return { level: 0, label: "", color: "bg-muted" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 25, label: "Weak", color: "bg-destructive" };
  if (score <= 2) return { level: 50, label: "Fair", color: "bg-amber-500" };
  if (score <= 3) return { level: 75, label: "Good", color: "bg-success" };
  return { level: 100, label: "Strong", color: "bg-success" };
};

const PasswordStrengthBar = ({ password }: PasswordStrengthBarProps) => {
  const { level, label, color } = getStrength(password);
  if (!password) return null;

  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${level}%` }}
        />
      </div>
      <p className={`text-[11px] font-medium ${
        level <= 25 ? "text-destructive" : level <= 50 ? "text-amber-500" : "text-success"
      }`}>
        {label}
      </p>
    </div>
  );
};

export default PasswordStrengthBar;
