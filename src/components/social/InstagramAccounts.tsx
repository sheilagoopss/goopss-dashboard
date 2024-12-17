import { useInstagramAccounts } from "@/hooks/useSocial";
import { InstagramFilled } from "@ant-design/icons";
import { Avatar, Skeleton, Typography } from "antd";
import { useEffect, useState } from "react";

const InstagramAccounts = ({ customerId }: { customerId: string }) => {
  const [accounts, setAccounts] = useState<
    { id: string; name: string; cover: string }[]
  >([]);
  const { getInstagramAccounts, isLoadingAccounts } = useInstagramAccounts();

  useEffect(() => {
    getInstagramAccounts(customerId).then((res) => {
      const listOfAccounts = res?.data;
      setAccounts(listOfAccounts);
    });
  }, [customerId, getInstagramAccounts]);

  return isLoadingAccounts ? (
    <Skeleton.Button />
  ) : (
    accounts?.map((account, index) => {
      return (
        <div
          key={index}
          className="flex flex-row items-center gap-2 border w-fit p-2 rounded-md"
        >
          <Avatar src={account.cover} alt={account.name} shape="square" size={50} />
          <Typography.Text>{account.name}</Typography.Text>
          <InstagramFilled style={{ fontSize: "2ch", color: "#E1306C" }} />
        </div>
      );
    })
  );
};

export default InstagramAccounts;
