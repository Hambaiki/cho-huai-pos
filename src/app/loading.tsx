import { Loader } from "@/components/ui/Loader";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-dvh">
      <div className="flex flex-col items-center">
        <Loader size={52} />
      </div>
    </div>
  );
}
