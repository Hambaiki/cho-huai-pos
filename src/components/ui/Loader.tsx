interface LoaderProps {
  size?: number;
  className?: string;
}

export function Loader({ size = 48, className = "" }: LoaderProps) {
  const sizeClass =
    size === 48
      ? "w-12 h-12"
      : size === 52
        ? "w-[52px] h-[52px]"
        : `w-[${size}px] h-[${size}px]`;

  return (
    <div
      className={`inline-block rounded-full border-6 border-white border-b-brand-600 box-border animate-rotation ${sizeClass} ${className}`}
    />
  );
}
