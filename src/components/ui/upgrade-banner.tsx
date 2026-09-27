import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

interface UpgradeBannerProps {
  children: React.ReactNode;
  onDismiss?: () => void;
}

export function UpgradeBanner({ children, onDismiss }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative rounded-lg bg-gradient-to-r from-primary/10 to-cyan-500/10 p-4 border border-primary/20">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-navy-800">{children}</p>
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="text-steel-500 hover:text-steel-700 shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}