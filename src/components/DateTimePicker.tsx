import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = "Pick a date and time",
  disabled = false,
  minDate,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Extract time from value or use defaults
  const hours = value ? value.getUTCHours().toString().padStart(2, "0") : "12";
  const minutes = value ? value.getUTCMinutes().toString().padStart(2, "0") : "00";

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange(undefined);
      return;
    }

    // Preserve existing time or use default
    const newDate = new Date(selectedDate);
    if (value) {
      newDate.setUTCHours(value.getUTCHours(), value.getUTCMinutes(), 0, 0);
    } else {
      newDate.setUTCHours(12, 0, 0, 0);
    }
    onChange(newDate);
  };

  const handleTimeChange = (type: "hours" | "minutes", val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return;

    const baseDate = value || new Date();
    const newDate = new Date(baseDate);

    if (type === "hours") {
      const clampedHours = Math.min(23, Math.max(0, num));
      newDate.setUTCHours(clampedHours, newDate.getUTCMinutes(), 0, 0);
    } else {
      const clampedMinutes = Math.min(59, Math.max(0, num));
      newDate.setUTCHours(newDate.getUTCHours(), clampedMinutes, 0, 0);
    }

    onChange(newDate);
  };

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
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Time (UTC)</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => handleTimeChange("hours", e.target.value)}
                className="w-16 text-center"
                placeholder="HH"
              />
              <span className="text-xl font-bold">:</span>
              <Input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => handleTimeChange("minutes", e.target.value)}
                className="w-16 text-center"
                placeholder="MM"
              />
            </div>
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