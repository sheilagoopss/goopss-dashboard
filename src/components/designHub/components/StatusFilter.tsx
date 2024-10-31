import { Segmented } from "antd";
import React from "react";

type StatusFilterType = "revision" | "pending" | "approved" | "all";

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
        { label: "For Revision", value: "revision" },
        { label: "To Approve", value: "pending" },
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
