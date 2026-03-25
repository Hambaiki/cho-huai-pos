import { Loader } from "@/components/ui/Loader";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full">
      <div className="flex flex-col items-center">
        <Loader size={52} />
      </div>
    </div>
  );
}
