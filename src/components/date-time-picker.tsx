"use client";

import { CalendarDays, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DateTimePickerProps = {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => padNumber(hour));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) => padNumber(minute));

export function DateTimePicker({
  value,
  disabled = false,
  onChange,
}: DateTimePickerProps) {
  const parts = splitDateTimeValue(value);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            className="justify-start text-left font-normal"
            disabled={disabled}
            variant="outline"
          />
        }
      >
        <CalendarDays data-icon="inline-start" />
        <span className={parts ? "text-foreground" : "text-muted-foreground"}>
          {parts ? formatDateTimeLabel(parts.date, parts.time) : "选择录入时间"}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80" sideOffset={10}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="recorded-at-date">日期</FieldLabel>
            <Input
              disabled={disabled}
              id="recorded-at-date"
              type="date"
              value={parts?.date ?? ""}
              onChange={(event) =>
                onChange(
                  joinDateTimeValue(
                    event.target.value || getTodayDatePart(),
                    parts?.time ?? getCurrentTimePart(),
                  ),
                )
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="recorded-at-time">时间</FieldLabel>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <NativeSelect
                disabled={disabled}
                id="recorded-at-hour"
                value={parts?.hour ?? "00"}
                onChange={(event) =>
                  onChange(
                    joinDateTimeValue(
                      parts?.date ?? getTodayDatePart(),
                      `${event.target.value}:${parts?.minute ?? "00"}`,
                    ),
                  )
                }
              >
                {HOUR_OPTIONS.map((hour) => (
                  <NativeSelectOption key={hour} value={hour}>
                    {hour} 时
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <Clock3 className="size-4 text-muted-foreground" />
              <NativeSelect
                disabled={disabled}
                id="recorded-at-minute"
                value={parts?.minute ?? "00"}
                onChange={(event) =>
                  onChange(
                    joinDateTimeValue(
                      parts?.date ?? getTodayDatePart(),
                      `${parts?.hour ?? "00"}:${event.target.value}`,
                    ),
                  )
                }
              >
                {MINUTE_OPTIONS.map((minute) => (
                  <NativeSelectOption key={minute} value={minute}>
                    {minute} 分
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </Field>
        </FieldGroup>
      </PopoverContent>
    </Popover>
  );
}

export function createDefaultRecordedAtValue() {
  const now = new Date();
  now.setSeconds(0, 0);
  return joinDateTimeValue(getDatePart(now), getTimePart(now));
}

function splitDateTimeValue(value: string) {
  if (!value) {
    return null;
  }

  const [datePart, timePart = "00:00"] = value.split("T");
  const [hour = "00", minute = "00"] = timePart.split(":");

  if (!datePart) {
    return null;
  }

  return {
    date: datePart,
    time: `${hour}:${minute}`,
    hour,
    minute,
  };
}

function joinDateTimeValue(date: string, time: string) {
  return `${date}T${time}`;
}

function formatDateTimeLabel(date: string, time: string) {
  const normalized = new Date(`${date}T${time}:00`);

  if (Number.isNaN(normalized.getTime())) {
    return `${date} ${time}`;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(normalized);
}

function getTodayDatePart() {
  return getDatePart(new Date());
}

function getCurrentTimePart() {
  return getTimePart(new Date());
}

function getDatePart(date: Date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

function getTimePart(date: Date) {
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
}

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}
