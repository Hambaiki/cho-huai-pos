"use client";

import { CircleX, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FormInput } from "@/components/ui/form";
import { cn } from "@/lib/utils/cn";

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  initialValue?: string;
  className?: string;
}

export function SearchInput({
  placeholder = "Search...",
  onSearch,
  debounceMs = 300,
  initialValue = "",
  className = "",
}: SearchInputProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (value === initialValue) {
      return;
    }

    const timer = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs, initialValue, onSearch]);

  const handleClear = useCallback(() => {
    setValue("");
  }, []);

  return (
    <div className={cn("relative flex-1", className)}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
      />
      <FormInput
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-10 bg-white"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-600"
          aria-label="Clear search"
        >
          <CircleX size={16} />
        </button>
      )}
    </div>
  );
}
