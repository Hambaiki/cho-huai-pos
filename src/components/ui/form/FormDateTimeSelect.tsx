"use client";

import { cn } from "@/lib/utils/cn";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  CheckIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  UIEvent,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FORM_OVERLAY_ROOT_ATTR, FormSelect } from "./FormSelect";
import { FormSelectOption } from "./FormSelectOption";

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openUpward: boolean;
  useWideLayout: boolean;
}

const VIEWPORT_PADDING = 8;
const DROPDOWN_GAP = 8;
const MIN_DROPDOWN_HEIGHT = 220;
const MIN_DROPDOWN_WIDTH = 320;
const MIN_DROPDOWN_WIDTH_WIDE = 560;
const TIME_WHEEL_ITEM_HEIGHT = 36;
const TIME_WHEEL_VISIBLE_ITEMS = 3;
const WIDE_LAYOUT_MIN_HEIGHT = 420;
const PANEL_HEIGHT_WIDE = 460;
const PANEL_HEIGHT_NARROW = 560;

const STORAGE_FORMAT_DATE_TIME = "yyyy-MM-dd'T'HH:mm";
const STORAGE_FORMAT_DATE = "yyyy-MM-dd";
const STORAGE_FORMAT_TIME = "HH:mm";
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
const FORM_OVERLAY_ROOT_SELECTOR = `[${FORM_OVERLAY_ROOT_ATTR}="true"]`;

export interface FormDateTimeSelectProps {
  className?: string;
  wrapperClassName?: string;
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  required?: boolean;
  mode?: "date-time" | "date" | "time";
  minuteStep?: number;
  displayFormat?: string;
  minDate?: Date;
  maxDate?: Date;
}

function parseStoredDateTime(
  value: string | undefined,
  mode: "date-time" | "date" | "time",
): Date | null {
  if (!value) return null;

  const reference = new Date();
  const formatPattern =
    mode === "date"
      ? STORAGE_FORMAT_DATE
      : mode === "time"
        ? STORAGE_FORMAT_TIME
        : STORAGE_FORMAT_DATE_TIME;

  const parsed = parse(value, formatPattern, reference);
  if (Number.isNaN(parsed.getTime())) return null;

  if (mode === "time") {
    const withToday = new Date(reference);
    withToday.setHours(parsed.getHours(), parsed.getMinutes(), 0, 0);
    return withToday;
  }

  return parsed;
}

function formatStoredDateTime(
  value: Date,
  mode: "date-time" | "date" | "time",
): string {
  const formatPattern =
    mode === "date"
      ? STORAGE_FORMAT_DATE
      : mode === "time"
        ? STORAGE_FORMAT_TIME
        : STORAGE_FORMAT_DATE_TIME;

  return format(value, formatPattern);
}

function toMonthStart(date: Date): Date {
  return startOfMonth(date);
}

function clampStep(step: number | undefined): number {
  if (!step || Number.isNaN(step)) return 15;
  return Math.min(Math.max(Math.floor(step), 1), 60);
}

function padTimeUnit(value: number): string {
  return value.toString().padStart(2, "0");
}

const FormDateTimeSelect = forwardRef<
  HTMLButtonElement,
  FormDateTimeSelectProps
>(
  (
    {
      id,
      name,
      value,
      defaultValue,
      onChange,
      onBlur,
      error,
      disabled,
      isLoading,
      placeholder = "Select date and time...",
      className,
      wrapperClassName,
      mode = "date-time",
      minuteStep = 15,
      displayFormat,
      minDate,
      maxDate,
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;

    const [internalValue, setInternalValue] = useState(
      defaultValue ?? value ?? "",
    );
    const selectedValue = value !== undefined ? value : internalValue;
    const selectedDate = parseStoredDateTime(selectedValue, mode);
    const resolvedDisplayFormat =
      displayFormat ??
      (mode === "date" ? "PPP" : mode === "time" ? "p" : "PPP p");
    const allowsCalendar = mode !== "time";
    const allowsTime = mode !== "date";

    const [open, setOpen] = useState(false);
    const [draftDate, setDraftDate] = useState<Date>(
      () => selectedDate ?? new Date(),
    );
    const [viewMonth, setViewMonth] = useState<Date>(() =>
      toMonthStart(selectedDate ?? new Date()),
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const scrollBodyRef = useRef<HTMLDivElement>(null);
    const calendarSectionRef = useRef<HTMLDivElement>(null);
    const timeSectionRef = useRef<HTMLDivElement>(null);
    const hourWheelRef = useRef<HTMLDivElement>(null);
    const minuteWheelRef = useRef<HTMLDivElement>(null);
    const hourScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
    const minuteScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

    useImperativeHandle(ref, () => buttonRef.current!);

    const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
      top: 0,
      left: 0,
      width: 0,
      maxHeight: 360,
      openUpward: false,
      useWideLayout: false,
    });

    const step = clampStep(minuteStep);
    const wheelPadding = Math.floor(TIME_WHEEL_VISIBLE_ITEMS / 2);

    const hourOptions = useMemo(
      () => Array.from({ length: 24 }, (_, index) => index),
      [],
    );

    const minuteOptions = useMemo(() => {
      const options: number[] = [];

      for (let minutes = 0; minutes < 60; minutes += step) {
        options.push(minutes);
      }

      return options;
    }, [step]);

    const yearOptions = useMemo(() => {
      const selectedYear = draftDate.getFullYear();
      const minYear = minDate?.getFullYear() ?? selectedYear - 10;
      const maxYear = maxDate?.getFullYear() ?? selectedYear + 10;
      const startYear = Math.min(minYear, selectedYear - 10);
      const endYear = Math.max(maxYear, selectedYear + 10);

      return Array.from(
        { length: endYear - startYear + 1 },
        (_, index) => startYear + index,
      );
    }, [draftDate, maxDate, minDate]);

    const days = useMemo(() => {
      const monthStart = startOfMonth(viewMonth);
      const monthEnd = endOfMonth(viewMonth);

      return eachDayOfInterval({
        start: startOfWeek(monthStart, { weekStartsOn: 1 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
      });
    }, [viewMonth]);

    const close = useCallback(() => {
      setOpen(false);
      onBlur?.();
    }, [onBlur]);

    const updateDropdownPosition = useCallback(() => {
      const trigger = buttonRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const availableBelow = viewportHeight - rect.bottom - DROPDOWN_GAP;
      const availableAbove = rect.top - DROPDOWN_GAP;
      const openUpward =
        availableBelow < MIN_DROPDOWN_HEIGHT && availableAbove > availableBelow;
      const availableHeight = openUpward ? availableAbove : availableBelow;
      const usesWideLayout =
        viewportWidth >= 768 && availableHeight >= WIDE_LAYOUT_MIN_HEIGHT;

      const maxWidth = viewportWidth - VIEWPORT_PADDING * 2;
      const dropdownWidth = Math.min(
        Math.max(
          rect.width,
          usesWideLayout ? MIN_DROPDOWN_WIDTH_WIDE : MIN_DROPDOWN_WIDTH,
        ),
        maxWidth,
      );

      const maxLeft = Math.max(
        VIEWPORT_PADDING,
        viewportWidth - dropdownWidth - VIEWPORT_PADDING,
      );
      const left = Math.min(Math.max(rect.left, VIEWPORT_PADDING), maxLeft);

      const top = openUpward
        ? Math.max(VIEWPORT_PADDING, rect.top - DROPDOWN_GAP)
        : Math.min(
            viewportHeight - VIEWPORT_PADDING,
            rect.bottom + DROPDOWN_GAP,
          );

      setDropdownPosition({
        top,
        left,
        width: dropdownWidth,
        maxHeight: Math.max(MIN_DROPDOWN_HEIGHT, availableHeight),
        openUpward,
        useWideLayout: usesWideLayout,
      });
    }, []);

    useLayoutEffect(() => {
      if (!open) return;
      updateDropdownPosition();
    }, [open, updateDropdownPosition]);

    useEffect(() => {
      if (!open) return;

      const handleReposition = () => updateDropdownPosition();
      window.addEventListener("resize", handleReposition);
      window.addEventListener("scroll", handleReposition, true);

      return () => {
        window.removeEventListener("resize", handleReposition);
        window.removeEventListener("scroll", handleReposition, true);
      };
    }, [open, updateDropdownPosition]);

    useEffect(() => {
      if (!open) return;

      const handleOutsidePointerDown = (event: MouseEvent) => {
        const target = event.target as Node;
        const insideTrigger = containerRef.current?.contains(target);
        const insideDropdown = dropdownRef.current?.contains(target);
        const insideNestedOverlay =
          target instanceof Element &&
          target.closest(FORM_OVERLAY_ROOT_SELECTOR) !== null;

        if (!insideTrigger && !insideDropdown && !insideNestedOverlay) {
          close();
        }
      };

      document.addEventListener("mousedown", handleOutsidePointerDown);
      return () =>
        document.removeEventListener("mousedown", handleOutsidePointerDown);
    }, [open, close]);

    useEffect(() => {
      if (!open) return;

      const handleFocusIn = (event: FocusEvent) => {
        const target = event.target as Node;
        const insideTrigger = containerRef.current?.contains(target);
        const insideDropdown = dropdownRef.current?.contains(target);
        const insideNestedOverlay =
          target instanceof Element &&
          target.closest(FORM_OVERLAY_ROOT_SELECTOR) !== null;

        if (!insideTrigger && !insideDropdown && !insideNestedOverlay) {
          close();
        }
      };

      document.addEventListener("focusin", handleFocusIn);
      return () => document.removeEventListener("focusin", handleFocusIn);
    }, [open, close]);

    const isDateDisabled = useCallback(
      (day: Date) => {
        const dayOnly = new Date(day);
        dayOnly.setHours(0, 0, 0, 0);

        if (minDate) {
          const minDateOnly = new Date(minDate);
          minDateOnly.setHours(0, 0, 0, 0);
          if (dayOnly < minDateOnly) return true;
        }

        if (maxDate) {
          const maxDateOnly = new Date(maxDate);
          maxDateOnly.setHours(0, 0, 0, 0);
          if (dayOnly > maxDateOnly) return true;
        }

        return false;
      },
      [maxDate, minDate],
    );

    const openPicker = () => {
      const base = selectedDate ?? new Date();
      setDraftDate(base);
      if (allowsCalendar) {
        setViewMonth(toMonthStart(base));
      }
      setOpen(true);
    };

    const setDatePart = (day: Date) => {
      if (!allowsCalendar) return;
      if (isDateDisabled(day)) return;

      setDraftDate((current) => {
        const next = new Date(current);
        next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
        return next;
      });
    };

    const setViewMonthFromParts = (month: number, year: number) => {
      if (!allowsCalendar) return;
      const nextMonth = new Date(viewMonth);
      nextMonth.setFullYear(year, month, 1);
      setViewMonth(startOfMonth(nextMonth));
    };

    const setTimePart = (hours: number, minutes: number) => {
      if (!allowsTime) return;
      setDraftDate((current) => {
        const next = new Date(current);
        next.setHours(hours, minutes, 0, 0);
        return next;
      });
    };

    const scrollWheelToIndex = useCallback(
      (element: HTMLDivElement | null, index: number) => {
        if (!element) return;

        element.scrollTo({
          top: index * TIME_WHEEL_ITEM_HEIGHT,
          behavior: "smooth",
        });
      },
      [],
    );

    const clearPendingWheelTimeouts = useCallback(() => {
      const hourTimeout = hourScrollTimeoutRef.current;
      const minuteTimeout = minuteScrollTimeoutRef.current;

      if (hourTimeout !== null) {
        clearTimeout(hourTimeout);
        hourScrollTimeoutRef.current = null;
      }

      if (minuteTimeout !== null) {
        clearTimeout(minuteTimeout);
        minuteScrollTimeoutRef.current = null;
      }
    }, []);

    useEffect(() => {
      return clearPendingWheelTimeouts;
    }, [clearPendingWheelTimeouts]);

    const scrollToSection = useCallback((section: "calendar" | "time") => {
      if (section === "calendar" && !allowsCalendar) return;
      if (section === "time" && !allowsTime) return;

      const container = scrollBodyRef.current;
      const target =
        section === "calendar"
          ? calendarSectionRef.current
          : timeSectionRef.current;

      if (!container || !target) return;

      const topOffset = 56;
      const targetTop = Math.max(0, target.offsetTop - topOffset);

      container.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
    }, [allowsCalendar, allowsTime]);

    useEffect(() => {
      if (!allowsTime) return;
      if (!open) return;

      const minuteIndex = minuteOptions.findIndex(
        (minute) => minute === draftDate.getMinutes(),
      );

      scrollWheelToIndex(hourWheelRef.current, draftDate.getHours());
      scrollWheelToIndex(
        minuteWheelRef.current,
        minuteIndex >= 0 ? minuteIndex : 0,
      );
    }, [allowsTime, draftDate, minuteOptions, open, scrollWheelToIndex]);

    const handleWheelScroll = useCallback(
      (
        event: UIEvent<HTMLDivElement>,
        options: number[],
        onSelect: (value: number) => void,
        timeoutRef: React.MutableRefObject<ReturnType<
          typeof setTimeout
        > | null>,
      ) => {
        const existingTimeout = timeoutRef.current;
        if (existingTimeout !== null) {
          clearTimeout(existingTimeout);
          timeoutRef.current = null;
        }

        const target = event.currentTarget;

        timeoutRef.current = setTimeout(() => {
          const rawIndex = Math.round(
            target.scrollTop / TIME_WHEEL_ITEM_HEIGHT,
          );
          const clampedIndex = Math.max(
            0,
            Math.min(rawIndex, options.length - 1),
          );
          const snappedTop = clampedIndex * TIME_WHEEL_ITEM_HEIGHT;

          target.scrollTo({ top: snappedTop, behavior: "smooth" });
          onSelect(options[clampedIndex]);
          timeoutRef.current = null;
        }, 80);
      },
      [],
    );

    const apply = () => {
      const nextValue = formatStoredDateTime(draftDate, mode);

      if (value === undefined) {
        setInternalValue(nextValue);
      }

      onChange?.(nextValue);
      close();
      buttonRef.current?.focus();
    };

    const clear = () => {
      if (value === undefined) {
        setInternalValue("");
      }

      onChange?.("");
      close();
      buttonRef.current?.focus();
    };

    const isDisabledOrLoading = disabled || isLoading;
    const panelHeight = Math.min(
      dropdownPosition.maxHeight,
      dropdownPosition.useWideLayout ? PANEL_HEIGHT_WIDE : PANEL_HEIGHT_NARROW,
    );

    return (
      <div
        ref={containerRef}
        className={cn("w-full flex flex-col", wrapperClassName)}
      >
        <input type="hidden" name={name} value={selectedValue} />

        <div className="relative w-full">
          <button
            ref={buttonRef}
            id={inputId}
            type="button"
            role="combobox"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={`${inputId}-panel`}
            aria-invalid={!!error}
            disabled={isDisabledOrLoading}
            onClick={() => {
              if (isDisabledOrLoading) return;
              if (open) {
                close();
                return;
              }

              openPicker();
            }}
            onKeyDown={(event) => {
              if (isDisabledOrLoading) return;

              switch (event.key) {
                case "ArrowDown":
                case "ArrowUp":
                case "Enter":
                case " ":
                  event.preventDefault();
                  openPicker();
                  break;
                case "Escape":
                  close();
                  break;
              }
            }}
            className={cn(
              "block w-full rounded-md border px-3 py-2 pr-10 text-sm",
              "text-left appearance-none cursor-pointer",
              "outline-none transition-colors",
              "border-neutral-200 text-neutral-900 bg-white",
              !isDisabledOrLoading && "hover:border-neutral-300",
              !isDisabledOrLoading &&
                "focus:border-brand-300 focus:ring-2 focus:ring-brand-200",
              error &&
                !isDisabledOrLoading &&
                "border-danger-300 focus:ring-danger-200 focus:border-danger-300",
              isDisabledOrLoading &&
                "bg-neutral-50 text-neutral-500 cursor-not-allowed",
              !selectedDate && "text-neutral-400",
              className,
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              <CalendarDays size={16} className="text-neutral-500 shrink-0" />
              <span className="block min-w-0 truncate whitespace-nowrap">
                {selectedDate
                  ? format(selectedDate, resolvedDisplayFormat)
                  : placeholder}
              </span>
            </span>
          </button>

          <div
            className={cn(
              "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform",
              open ? "rotate-180" : "rotate-0",
              isDisabledOrLoading ? "text-neutral-400" : "text-neutral-500",
            )}
          >
            <ChevronDown size={16} />
          </div>

          {open &&
            createPortal(
              <div
                ref={dropdownRef}
                id={`${inputId}-panel`}
                role="dialog"
                aria-modal="false"
                style={{
                  position: "fixed",
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                  maxHeight: dropdownPosition.maxHeight,
                  transform: dropdownPosition.openUpward
                    ? "translateY(-100%)"
                    : undefined,
                }}
                className={cn(
                  "z-1000 rounded-md border border-neutral-200 bg-white shadow-lg",
                  "overflow-hidden outline-none overscroll-contain",
                )}
                onKeyDown={(event) => {
                  if (event.key === "Escape" || event.key === "Tab") {
                    close();
                  }
                }}
              >
                <div
                  className="flex flex-col"
                  style={{
                    height: panelHeight,
                    maxHeight: dropdownPosition.maxHeight,
                  }}
                >
                  <div className="flex items-center justify-left gap-2 border-b border-neutral-200 bg-white p-2">
                    {allowsCalendar && (
                      <button
                        type="button"
                        onClick={() => scrollToSection("calendar")}
                        className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                      >
                        Calendar
                      </button>
                    )}

                    {allowsTime && (
                      <button
                        type="button"
                        onClick={() => scrollToSection("time")}
                        className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                      >
                        Time
                      </button>
                    )}
                  </div>

                  <div
                    ref={scrollBodyRef}
                    className="min-h-0 flex-1 overflow-y-auto space-y-4 p-2"
                  >
                    <div
                      className={cn(
                        "grid gap-4",
                        allowsCalendar &&
                          allowsTime &&
                          dropdownPosition.useWideLayout &&
                          "md:grid-cols-[minmax(280px,1fr)_220px] md:items-start",
                      )}
                    >
                      {allowsCalendar && (
                        <div
                          ref={calendarSectionRef}
                          className="space-y-3 scroll-mt-14"
                        >
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              setViewMonth((month) => subMonths(month, 1))
                            }
                            className="rounded p-1 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                            aria-label="Previous month"
                          >
                            <ChevronLeft size={16} />
                          </button>

                          <div className="flex items-center gap-2">
                            <FormSelect
                              value={String(viewMonth.getMonth())}
                              onChange={(nextMonth) =>
                                setViewMonthFromParts(
                                  Number(nextMonth),
                                  viewMonth.getFullYear(),
                                )
                              }
                              hideCheckmark
                              className="h-8 min-w-34 py-1 pr-8 text-sm"
                              wrapperClassName="w-auto"
                              aria-label="Select month"
                            >
                              {MONTH_NAMES.map((monthName, index) => (
                                <FormSelectOption
                                  key={monthName}
                                  value={String(index)}
                                >
                                  {monthName}
                                </FormSelectOption>
                              ))}
                            </FormSelect>

                            <FormSelect
                              value={String(viewMonth.getFullYear())}
                              onChange={(nextYear) =>
                                setViewMonthFromParts(
                                  viewMonth.getMonth(),
                                  Number(nextYear),
                                )
                              }
                              hideCheckmark
                              className="h-8 min-w-24 py-1 pr-8 text-sm"
                              wrapperClassName="w-auto"
                              aria-label="Select year"
                            >
                              {yearOptions.map((year) => (
                                <FormSelectOption
                                  key={year}
                                  value={String(year)}
                                >
                                  {year}
                                </FormSelectOption>
                              ))}
                            </FormSelect>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setViewMonth((month) => addMonths(month, 1))
                            }
                            className="rounded p-1 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                            aria-label="Next month"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-500">
                          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(
                            (day) => (
                              <span key={day}>{day}</span>
                            ),
                          )}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {days.map((day) => {
                            const inCurrentMonth = isSameMonth(day, viewMonth);
                            const selected = isSameDay(day, draftDate);
                            const isDisabledDay = isDateDisabled(day);

                            return (
                              <button
                                key={day.toISOString()}
                                type="button"
                                onClick={() => setDatePart(day)}
                                disabled={isDisabledDay}
                                className={cn(
                                  "h-8 rounded text-sm transition-colors",
                                  inCurrentMonth
                                    ? "text-neutral-900"
                                    : "text-neutral-400",
                                  selected &&
                                    "bg-brand-500 text-white hover:bg-brand-600",
                                  !selected &&
                                    !isDisabledDay &&
                                    "hover:bg-neutral-100",
                                  isDisabledDay &&
                                    "cursor-not-allowed text-neutral-300",
                                )}
                              >
                                {format(day, "d")}
                              </button>
                            );
                          })}
                        </div>
                        </div>
                      )}

                      {allowsTime && (
                        <div
                          ref={timeSectionRef}
                          className={cn(
                            "space-y-3 scroll-mt-14",
                            allowsCalendar &&
                              dropdownPosition.useWideLayout &&
                              "md:border-l md:border-neutral-200 md:pl-4",
                          )}
                        >
                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                            Time
                          </p>
                          <div className="rounded-md border border-neutral-200 p-2">
                            <p className="text-xs text-neutral-500">
                              Selected time
                            </p>
                            <p className="mt-1 text-sm font-semibold text-neutral-900">
                              {format(draftDate, "p")}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              {step}-minute increments
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                            Scroll time
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-xs text-neutral-500">Hour</p>
                              <div className="relative rounded-md border border-neutral-200 bg-white">
                                <div className="pointer-events-none absolute inset-x-1 top-1/2 z-0 h-9 -translate-y-1/2 rounded bg-brand-50 ring-1 ring-brand-100" />
                                <div
                                  ref={hourWheelRef}
                                  onScroll={(event) =>
                                    handleWheelScroll(
                                      event,
                                      hourOptions,
                                      (hour) =>
                                        setTimePart(
                                          hour,
                                          draftDate.getMinutes(),
                                        ),
                                      hourScrollTimeoutRef,
                                    )
                                  }
                                  className="relative z-10 h-27 snap-y snap-mandatory overflow-y-auto scrollbar-none"
                                  style={{
                                    paddingTop:
                                      wheelPadding * TIME_WHEEL_ITEM_HEIGHT,
                                    paddingBottom:
                                      wheelPadding * TIME_WHEEL_ITEM_HEIGHT,
                                  }}
                                >
                                  {hourOptions.map((hour) => {
                                    const selected =
                                      hour === draftDate.getHours();

                                    return (
                                      <button
                                        key={hour}
                                        type="button"
                                        onClick={() => {
                                          setTimePart(
                                            hour,
                                            draftDate.getMinutes(),
                                          );
                                          scrollWheelToIndex(
                                            hourWheelRef.current,
                                            hour,
                                          );
                                        }}
                                        className={cn(
                                          "flex h-9 w-full snap-center items-center justify-center text-sm transition-colors",
                                          selected
                                            ? "font-semibold text-brand-700"
                                            : "text-neutral-600 hover:text-neutral-900",
                                        )}
                                      >
                                        {padTimeUnit(hour)}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs text-neutral-500">Minute</p>
                              <div className="relative rounded-md border border-neutral-200 bg-white">
                                <div className="pointer-events-none absolute inset-x-1 top-1/2 z-0 h-9 -translate-y-1/2 rounded bg-brand-50 ring-1 ring-brand-100" />
                                <div
                                  ref={minuteWheelRef}
                                  onScroll={(event) =>
                                    handleWheelScroll(
                                      event,
                                      minuteOptions,
                                      (minute) =>
                                        setTimePart(
                                          draftDate.getHours(),
                                          minute,
                                        ),
                                      minuteScrollTimeoutRef,
                                    )
                                  }
                                  className="relative z-10 h-27 snap-y snap-mandatory overflow-y-auto scrollbar-none"
                                  style={{
                                    paddingTop:
                                      wheelPadding * TIME_WHEEL_ITEM_HEIGHT,
                                    paddingBottom:
                                      wheelPadding * TIME_WHEEL_ITEM_HEIGHT,
                                  }}
                                >
                                  {minuteOptions.map((minute, index) => {
                                    const selected =
                                      minute === draftDate.getMinutes();

                                    return (
                                      <button
                                        key={minute}
                                        type="button"
                                        onClick={() => {
                                          setTimePart(
                                            draftDate.getHours(),
                                            minute,
                                          );
                                          scrollWheelToIndex(
                                            minuteWheelRef.current,
                                            index,
                                          );
                                        }}
                                        className={cn(
                                          "flex h-9 w-full snap-center items-center justify-center text-sm transition-colors",
                                          selected
                                            ? "font-semibold text-brand-700"
                                            : "text-neutral-600 hover:text-neutral-900",
                                        )}
                                      >
                                        {padTimeUnit(minute)}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-neutral-200 bg-white p-2">
                    <button
                      type="button"
                      onClick={clear}
                      className="rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={apply}
                      className="inline-flex items-center gap-1 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600"
                    >
                      <CheckIcon size={14} />
                      Apply
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}
        </div>
      </div>
    );
  },
);

FormDateTimeSelect.displayName = "FormDateTimeSelect";

export { FormDateTimeSelect };
