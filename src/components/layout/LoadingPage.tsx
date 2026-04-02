import { Loader } from "@/components/content/Loader";
import { cn } from "@/lib/utils/cn";

interface LoadingPageProps {
  variant?: "default" | "fullscreen";
}

export default function LoadingPage({ variant = "default" }: LoadingPageProps) {
  return (
    <div
      className={cn(
        "flex-1 flex flex-col items-center justify-center",
        variant === "fullscreen" && "h-dvh",
      )}
    >
      <div className="flex flex-col items-center">
        <Loader size={52} />
      </div>
    </div>
  );
}
