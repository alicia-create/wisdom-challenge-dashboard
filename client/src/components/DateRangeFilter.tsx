import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { DATE_RANGES, type DateRange } from "@shared/constants";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [error, setError] = useState("");

  const handlePresetClick = (range: DateRange) => {
    onChange(range);
  };

  const validateDate = (dateStr: string): boolean => {
    // MM/DD/YYYY format
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    if (!regex.test(dateStr)) return false;

    const [month, day, year] = dateStr.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const handleApply = () => {
    setError("");

    if (!startDate || !endDate) {
      setError("Both dates are required");
      return;
    }

    if (!validateDate(startDate)) {
      setError("Invalid start date. Use MM/DD/YYYY format");
      return;
    }

    if (!validateDate(endDate)) {
      setError("Invalid end date. Use MM/DD/YYYY format");
      return;
    }

    // Convert MM/DD/YYYY to YYYY-MM-DD for backend
    const [startMonth, startDay, startYear] = startDate.split("/");
    const [endMonth, endDay, endYear] = endDate.split("/");
    
    const startFormatted = `${startYear}-${startMonth.padStart(2, "0")}-${startDay.padStart(2, "0")}`;
    const endFormatted = `${endYear}-${endMonth.padStart(2, "0")}-${endDay.padStart(2, "0")}`;
    
    const customRange = `${startFormatted} to ${endFormatted}` as DateRange;
    onChange(customRange);
    setIsPopoverOpen(false);
    setStartDate("");
    setEndDate("");
  };

  const isActive = (range: DateRange) => value === range;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={isActive(DATE_RANGES.TODAY) ? "default" : "outline"}
        size="sm"
        onClick={() => handlePresetClick(DATE_RANGES.TODAY)}
      >
        TODAY
      </Button>
      <Button
        variant={isActive(DATE_RANGES.YESTERDAY) ? "default" : "outline"}
        size="sm"
        onClick={() => handlePresetClick(DATE_RANGES.YESTERDAY)}
      >
        YESTERDAY
      </Button>
      <Button
        variant={isActive(DATE_RANGES.LAST_7_DAYS) ? "default" : "outline"}
        size="sm"
        onClick={() => handlePresetClick(DATE_RANGES.LAST_7_DAYS)}
      >
        7 DAYS
      </Button>
      <Button
        variant={isActive(DATE_RANGES.LAST_14_DAYS) ? "default" : "outline"}
        size="sm"
        onClick={() => handlePresetClick(DATE_RANGES.LAST_14_DAYS)}
      >
        14 DAYS
      </Button>
      <Button
        variant={isActive(DATE_RANGES.LAST_30_DAYS) ? "default" : "outline"}
        size="sm"
        onClick={() => handlePresetClick(DATE_RANGES.LAST_30_DAYS)}
      >
        30 DAYS
      </Button>
      <Button
        variant={isActive(DATE_RANGES.ALL) ? "default" : "outline"}
        size="sm"
        onClick={() => handlePresetClick(DATE_RANGES.ALL)}
      >
        ALL
      </Button>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={
              !Object.values(DATE_RANGES).includes(value) ? "default" : "outline"
            }
            size="sm"
          >
            <CalendarIcon className="h-3 w-3 mr-1" />
            Custom
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Start Date
              </label>
              <Input
                type="text"
                placeholder="MM/DD/YYYY"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                End Date
              </label>
              <Input
                type="text"
                placeholder="MM/DD/YYYY"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="font-mono"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <Button
              onClick={handleApply}
              className="w-full"
              size="sm"
            >
              Apply Range
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
