import { Segmented } from "antd";
import React from "react";

export type StatusFilterType = "revision" | "pending" | "approved" | "all";

interface StatusFilterProps {
  statusFilter: StatusFilterType;
  setStatusFilter: (status: StatusFilterType) => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({
  statusFilter,
  setStatusFilter,
}) => {
  return (
    <Segmented
      block
      options={[
        { label: "To Approve", value: "pending" },
        { label: "For Revision", value: "revision" },
        { label: "Approved", value: "approved" },
        { label: "All Images", value: "all" },
      ]}
      value={statusFilter}
      onChange={(value) => setStatusFilter(value as StatusFilterType)}
      style={{ padding: "0.5ch" }}
    />
  );
};

export default StatusFilter;
