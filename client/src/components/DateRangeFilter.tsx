import { DATE_RANGES, type DateRange } from "@shared/constants";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [customStart, setCustomStart] = useState<Date>();
  const [customEnd, setCustomEnd] = useState<Date>();
  const [isCustom, setIsCustom] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const ranges: DateRange[] = [
    DATE_RANGES.TODAY,
    DATE_RANGES.YESTERDAY,
    DATE_RANGES.LAST_7_DAYS,
    DATE_RANGES.LAST_14_DAYS,
    DATE_RANGES.LAST_30_DAYS,
  ];

  const handleCustomRange = () => {
    if (customStart && customEnd) {
      const customRange = `${format(customStart, 'yyyy-MM-dd')} to ${format(customEnd, 'yyyy-MM-dd')}` as DateRange;
      onChange(customRange);
      setIsCustom(true);
      setIsPopoverOpen(false);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {ranges.map((range) => (
        <Button
          key={range}
          variant={value === range && !isCustom ? "default" : "outline"}
          size="sm"
          onClick={() => { onChange(range); setIsCustom(false); }}
          className="text-xs font-medium"
        >
          {range}
        </Button>
      ))}
      
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={isCustom ? "default" : "outline"}
            size="sm"
            className="text-xs font-medium"
          >
            <CalendarIcon className="h-3 w-3 mr-1" />
            Custom
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Calendar
                mode="single"
                selected={customStart}
                onSelect={setCustomStart}
                initialFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Calendar
                mode="single"
                selected={customEnd}
                onSelect={setCustomEnd}
              />
            </div>
            <Button
              onClick={handleCustomRange}
              disabled={!customStart || !customEnd}
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
