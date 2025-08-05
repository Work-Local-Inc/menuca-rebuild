import React from 'react';
import { Calendar, CalendarIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface DateRange {
  from: Date;
  to: Date;
}

interface DatePickerWithRangeProps {
  date: DateRange;
  onDateChange: (date: DateRange) => void;
  className?: string;
}

export const DatePickerWithRange: React.FC<DatePickerWithRangeProps> = ({
  date,
  onDateChange,
  className
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempFrom, setTempFrom] = React.useState(date.from.toISOString().split('T')[0]);
  const [tempTo, setTempTo] = React.useState(date.to.toISOString().split('T')[0]);

  const formatDateRange = (from: Date, to: Date) => {
    const fromStr = from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const toStr = to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fromStr} - ${toStr}`;
  };

  const handleApply = () => {
    const newFrom = new Date(tempFrom);
    const newTo = new Date(tempTo);
    
    if (newFrom <= newTo) {
      onDateChange({ from: newFrom, to: newTo });
      setIsOpen(false);
    }
  };

  const handleQuickSelect = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    
    setTempFrom(from.toISOString().split('T')[0]);
    setTempTo(to.toISOString().split('T')[0]);
    onDateChange({ from, to });
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        className="w-64 justify-start text-left font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {formatDateRange(date.from, date.to)}
      </Button>
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full z-50 mt-1 w-80 rounded-md border border-gray-200 bg-white shadow-lg">
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <input
                  type="date"
                  value={tempFrom}
                  onChange={(e) => setTempFrom(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <input
                  type="date"
                  value={tempTo}
                  onChange={(e) => setTempTo(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Quick Select</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSelect(7)}
                  >
                    7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSelect(30)}
                  >
                    30 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSelect(90)}
                  >
                    90 days
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};