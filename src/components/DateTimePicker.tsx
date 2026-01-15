import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = "Pick a date and time",
  disabled = false,
  minDate,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange(undefined);
      return;
    }

    const newDate = new Date(selectedDate);
    if (value) {
      newDate.setUTCHours(value.getUTCHours(), value.getUTCMinutes(), 0, 0);
    } else {
      newDate.setUTCHours(12, 0, 0, 0);
    }
    onChange(newDate);
  };

  const handleTimePreset = (hours: number, minutes: number) => {
    const baseDate = value || new Date();
    const newDate = new Date(baseDate);
    newDate.setUTCHours(hours, minutes, 0, 0);
    onChange(newDate);
  };

  const currentTimeLabel = value
    ? `${value.getUTCHours().toString().padStart(2, "0")}:${value.getUTCMinutes().toString().padStart(2, "0")} UTC`
    : "Select time";

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
              format(value, "PPP") + " at " + format(value, "HH:mm") + " UTC"
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
            <div className="text-sm font-medium text-muted-foreground">Quick Time (UTC)</div>
            <div className="flex flex-wrap gap-2">
              {TIME_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTimePreset(preset.hours, preset.minutes)}
                  className={cn(
                    "text-xs",
                    value && value.getUTCHours() === preset.hours && value.getUTCMinutes() === preset.minutes
                      ? "bg-primary text-primary-foreground"
                      : ""
                  )}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Select
              value={value ? `${value.getUTCHours()}:${value.getUTCMinutes()}` : undefined}
              onValueChange={(val) => {
                const [h, m] = val.split(":").map(Number);
                handleTimePreset(h, m);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Or select custom time" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, h) => (
                  <React.Fragment key={h}>
                    <SelectItem value={`${h}:0`}>
                      {h.toString().padStart(2, "0")}:00 UTC
                    </SelectItem>
                    <SelectItem value={`${h}:30`}>
                      {h.toString().padStart(2, "0")}:30 UTC
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