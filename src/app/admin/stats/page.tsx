"use client";

import React, { useCallback, useEffect, useState } from "react";
import StatList from "@/components/stats/StatList";
import { useStatFetchAll } from "@/hooks/useStat";
import { IStat } from "@/types/Stat";

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
    <div>
      <h2>Statistics Overview</h2>
      <StatList stats={stats} loading={isLoading} refresh={loadStats} />
    </div>
  );
};

export default Stats;
