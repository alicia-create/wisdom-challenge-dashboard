import { DATE_RANGES, type DateRange } from "@shared/constants";
import { Button } from "./ui/button";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const ranges: DateRange[] = [
    DATE_RANGES.TODAY,
    DATE_RANGES.YESTERDAY,
    DATE_RANGES.LAST_7_DAYS,
    DATE_RANGES.LAST_14_DAYS,
    DATE_RANGES.LAST_30_DAYS,
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {ranges.map((range) => (
        <Button
          key={range}
          variant={value === range ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(range)}
          className="text-xs font-medium"
        >
          {range}
        </Button>
      ))}
    </div>
  );
}
