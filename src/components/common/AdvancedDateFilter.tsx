import React, { useState } from "react";
import { DatePicker, Button, Select, Space, Divider, message } from "antd";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

type RangeValue<T> = [T, T] | null;

interface AdvancedDateFilterProps {
  handleClear: () => void;
  handleDateFilter: (params: {
    startDate: Dayjs | null;
    endDate: Dayjs | null;
  }) => void;
  onClose?: () => void;
}

const AdvancedDateFilter: React.FC<AdvancedDateFilterProps> = ({
  handleDateFilter,
  handleClear,
  onClose,
}) => {
  const [dateRange, setDateRange] = useState<RangeValue<Dayjs | null>>(null);
  const [quickSelect, setQuickSelect] = useState<string | null>(null);

  const presetRanges: Record<string, [Dayjs, Dayjs]> = {
    Today: [dayjs().startOf("day"), dayjs().endOf("day")],
    "This Week": [dayjs().startOf("week"), dayjs().endOf("week")],
    "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
    "Last 7 Days": [dayjs().subtract(7, "days"), dayjs()],
  };

  const handleQuickSelect = (value: string) => {
    setQuickSelect(value);
    setDateRange(presetRanges[value] || null);
  };

  const handleRangeChange = (dates: RangeValue<Dayjs | null>) => {
    setDateRange(dates);
    setQuickSelect(null);
  };

  const clearFilters = () => {
    setDateRange(null);
    setQuickSelect(null);
    handleClear();
    onClose && onClose();
  };

  const applyFilters = () => {
    if (!dateRange) {
      message.error("Please select a date range or use the quick select!");
      return;
    }
    handleDateFilter({
      startDate: dateRange[0],
      endDate: dateRange[1],
    });
    onClose && onClose();
  };

  return (
    <div
      style={{
        padding: "16px",
        background: "#fff",
        border: "1px solid #d9d9d9",
        borderRadius: "4px",
        width: 400,
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Select
          value={quickSelect}
          placeholder="Quick Select"
          onChange={handleQuickSelect}
          style={{ width: "100%" }}
        >
          <Option value="Today">Today</Option>
          <Option value="This Week">This Week</Option>
          <Option value="This Month">This Month</Option>
          <Option value="Last 7 Days">Last 7 Days</Option>
        </Select>

        <RangePicker
          value={dateRange}
          onChange={handleRangeChange}
          style={{ width: "100%" }}
          disabledDate={(current) => current && current > dayjs().endOf("day")}
        />

        <Divider />

        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Button onClick={clearFilters}>Clear</Button>
          <Button type="primary" onClick={applyFilters}>
            Apply
          </Button>
        </Space>
      </Space>
    </div>
  );
};

export default AdvancedDateFilter;
