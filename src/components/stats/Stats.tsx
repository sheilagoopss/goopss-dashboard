/* eslint-disable react-hooks/exhaustive-deps */
import {
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Input, Layout, Popover } from "antd";
import { useEffect, useState } from "react";
import { caseInsensitiveSearch } from "../../utils/caseInsensitveMatch";
import dayjs, { Dayjs } from "dayjs";
import AdvancedDateFilter from "../common/AdvancedDateFilter";
import { IStat } from "../../types/Stat";
import { useStatFetchAll } from "../../hooks/useStat";
import StatList from "./components/StatList";

const { Content } = Layout;

interface IFilterQueries {
  searchValue?: string;
  startDate?: Dayjs;
  endDate?: Dayjs;
}

const Stats = () => {
  const { fetchAllStats, isLoading } = useStatFetchAll();
  const [stats, setStats] = useState<IStat[]>([]);
  const [filteredStat, setFilteredStat] = useState<IStat[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterQueries, setFilterQueries] = useState<IFilterQueries>({
    searchValue: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  const refresh = async () => {
    const stats = await fetchAllStats();
    setStats(stats);
    setFilteredStat(
      stats.sort((a, b) => (dayjs(a.timestamp).isBefore(b.timestamp) ? 1 : -1)),
    );
  };

  const handleSearch = (searchValue?: string, data?: IStat[]) => {
    const filterColumns: (keyof IStat)[] = ["shop"];
    const filtered = (data || stats)?.filter((val) =>
      filterColumns.some((v) =>
        caseInsensitiveSearch(val[v] || "", searchValue),
      ),
    );
    setFilteredStat(filtered);
  };

  const handleOpenChange = () => {
    setFilterOpen(!filterOpen);
  };

  useEffect(() => {
    if (stats) {
      let filteredData = stats;
      if (filterQueries.startDate && filterQueries.endDate) {
        filteredData = stats.filter(
          (task) =>
            dayjs(task.timestamp).isAfter(filterQueries.startDate) &&
            dayjs(task.timestamp).isBefore(filterQueries.endDate),
        );
      }

      handleSearch(filterQueries.searchValue, filteredData);
    }
  }, [filterQueries]);

  useEffect(() => {
    refresh();
  }, []);

  return (
    <Layout style={{ backgroundColor: "white" }}>
      <Content style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "1ch",
            }}
          >
            <h2 style={{ fontWeight: "bolder" }}>Stats</h2>
          </div>
          <div style={{ display: "flex", gap: "2ch" }}>
            <Popover
              content={
                <AdvancedDateFilter
                  handleClear={() =>
                    setFilterQueries({
                      ...filterQueries,
                      startDate: undefined,
                      endDate: undefined,
                    })
                  }
                  handleDateFilter={(params) =>
                    setFilterQueries({
                      ...filterQueries,
                      startDate: params.startDate || undefined,
                      endDate: params.endDate || undefined,
                    })
                  }
                  onClose={() => setFilterOpen(false)}
                />
              }
              title="Filter"
              trigger="click"
              open={filterOpen}
              onOpenChange={handleOpenChange}
            >
              <Button icon={<FilterOutlined />} style={{ width: "3rem" }} />
            </Popover>
            <Input
              placeholder="Search stats"
              prefix={<SearchOutlined className="h-5 w-5 text-gray-400" />}
              onChange={(e) =>
                setFilterQueries({
                  ...filterQueries,
                  searchValue: e.target.value,
                })
              }
              allowClear
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refresh()}
              loading={isLoading}
              style={{ width: "3rem" }}
            />
          </div>
        </div>
        <StatList loading={isLoading} refresh={refresh} stats={filteredStat} />
      </Content>
    </Layout>
  );
};

export default Stats;
