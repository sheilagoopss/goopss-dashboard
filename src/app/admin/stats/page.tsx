"use client";

import React, { useCallback, useEffect, useState } from "react";
import StatList from "@/components/stats/StatList";
import { useStatFetchAll } from "@/hooks/useStat";
import { IStat } from "@/types/Stat";
import { Content } from "antd/es/layout/layout";
import Title from "antd/es/typography/Title";

const Stats: React.FC = () => {
  const { fetchAllStats, isLoading } = useStatFetchAll();
  const [stats, setStats] = useState<IStat[]>([]);

  const loadStats = useCallback(async () => {
    const fetchedStats = await fetchAllStats();
    setStats(fetchedStats);
  }, [fetchAllStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <Content className="p-4">
      <Title level={2}>Statistics Overview</Title>
      <StatList stats={stats} loading={isLoading} refresh={loadStats} />
    </Content>
  );
};

export default Stats;
