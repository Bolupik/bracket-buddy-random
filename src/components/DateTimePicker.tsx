import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
}

const TIME_PRESETS = [
  { label: "9:00", hours: 9, minutes: 0 },
  { label: "10:00", hours: 10, minutes: 0 },
  { label: "12:00", hours: 12, minutes: 0 },
  { label: "14:00", hours: 14, minutes: 0 },
  { label: "17:00", hours: 17, minutes: 0 },
  { label: "18:00", hours: 18, minutes: 0 },
  { label: "20:00", hours: 20, minutes: 0 },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC", offset: 0 },
  { value: "America/New_York", label: "EST/EDT (New York)", offset: -5 },
  { value: "America/Chicago", label: "CST/CDT (Chicago)", offset: -6 },
  { value: "America/Denver", label: "MST/MDT (Denver)", offset: -7 },
  { value: "America/Los_Angeles", label: "PST/PDT (Los Angeles)", offset: -8 },
  { value: "Europe/London", label: "GMT/BST (London)", offset: 0 },
  { value: "Europe/Paris", label: "CET/CEST (Paris)", offset: 1 },
  { value: "Europe/Berlin", label: "CET/CEST (Berlin)", offset: 1 },
  { value: "Asia/Tokyo", label: "JST (Tokyo)", offset: 9 },
  { value: "Asia/Shanghai", label: "CST (Shanghai)", offset: 8 },
  { value: "Asia/Singapore", label: "SGT (Singapore)", offset: 8 },
  { value: "Australia/Sydney", label: "AEST/AEDT (Sydney)", offset: 10 },
];

// Get the user's local timezone
const getLocalTimezone = () => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const found = TIMEZONES.find(t => t.value === tz);
  return found ? tz : "UTC";
};

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = "Pick a date and time",
  disabled = false,
  minDate,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedTimezone, setSelectedTimezone] = React.useState(getLocalTimezone);

  // Get timezone offset in hours (handles DST via the actual Date)
  const getTimezoneOffset = (tz: string, date: Date = new Date()) => {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
  };

  // Convert UTC hours to display hours in selected timezone
  const utcToLocal = (utcHours: number, utcMinutes: number, date: Date = new Date()) => {
    const offset = getTimezoneOffset(selectedTimezone, date);
    let localHours = utcHours + offset;
    let localMinutes = utcMinutes;
    
    if (localHours >= 24) localHours -= 24;
    if (localHours < 0) localHours += 24;
    
    return { hours: Math.floor(localHours), minutes: localMinutes };
  };

  // Convert local hours to UTC hours
  const localToUtc = (localHours: number, localMinutes: number, date: Date = new Date()) => {
    const offset = getTimezoneOffset(selectedTimezone, date);
    let utcHours = localHours - offset;
    let utcMinutes = localMinutes;
    
    if (utcHours >= 24) utcHours -= 24;
    if (utcHours < 0) utcHours += 24;
    
    return { hours: Math.floor(utcHours), minutes: utcMinutes };
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange(undefined);
      return;
    }

    const newDate = new Date(selectedDate);
    if (value) {
      newDate.setUTCHours(value.getUTCHours(), value.getUTCMinutes(), 0, 0);
    } else {
      // Default to 12:00 in selected timezone
      const { hours, minutes } = localToUtc(12, 0, newDate);
      newDate.setUTCHours(hours, minutes, 0, 0);
    }
    onChange(newDate);
  };

  const handleTimePreset = (localHours: number, localMinutes: number) => {
    const baseDate = value || new Date();
    const newDate = new Date(baseDate);
    const { hours, minutes } = localToUtc(localHours, localMinutes, newDate);
    newDate.setUTCHours(hours, minutes, 0, 0);
    onChange(newDate);
  };

  const handleNow = () => {
    const now = new Date();
    onChange(now);
  };

  const handleCustomTimeChange = (val: string) => {
    const [h, m] = val.split(":").map(Number);
    handleTimePreset(h, m);
  };

  // Get current time display in selected timezone
  const getDisplayTime = () => {
    if (!value) return null;
    const { hours, minutes } = utcToLocal(value.getUTCHours(), value.getUTCMinutes(), value);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const displayTime = getDisplayTime();
  const tzLabel = TIMEZONES.find(tz => tz.value === selectedTimezone)?.label.split(" ")[0] || selectedTimezone;

  // Get current local time for highlighting presets
  const getCurrentLocalTime = () => {
    if (!value) return null;
    return utcToLocal(value.getUTCHours(), value.getUTCMinutes(), value);
  };

  const currentLocal = getCurrentLocalTime();

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium">{label}</label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal h-12",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              format(value, "PPP") + " at " + displayTime + " " + tzLabel
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={(date) => minDate ? date < minDate : false}
            initialFocus
            className="p-3 pointer-events-auto"
          />
          <div className="border-t p-3 space-y-3">
            {/* Timezone selector */}
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">Quick Time ({tzLabel})</div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNow}
                className="text-xs gap-1"
              >
                <Clock className="h-3 w-3" />
                Now
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {TIME_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTimePreset(preset.hours, preset.minutes)}
                  className={cn(
                    "text-xs",
                    currentLocal && currentLocal.hours === preset.hours && currentLocal.minutes === preset.minutes
                      ? "bg-primary text-primary-foreground"
                      : ""
                  )}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Select
              value={currentLocal ? `${currentLocal.hours}:${currentLocal.minutes}` : undefined}
              onValueChange={handleCustomTimeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Or select custom time" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, h) => (
                  <React.Fragment key={h}>
                    <SelectItem value={`${h}:0`}>
                      {h.toString().padStart(2, "0")}:00
                    </SelectItem>
                    <SelectItem value={`${h}:30`}>
                      {h.toString().padStart(2, "0")}:30
                    </SelectItem>
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="border-t p-3">
            <Button
              size="sm"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}