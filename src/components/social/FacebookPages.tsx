import { useFacebookPages } from "@/hooks/useSocial";
import { FacebookFilled } from "@ant-design/icons";
import { Avatar, Skeleton, Typography } from "antd";
import { useEffect, useState } from "react";

const FacebookPages = ({ customerId }: { customerId: string }) => {
  const [pages, setPages] = useState<
    { id: string; name: string; cover: string }[]
  >([]);
  const { getFacebookPages, isLoadingPages } = useFacebookPages();

  useEffect(() => {
    getFacebookPages(customerId).then((res) => {
      const listOfPages = res?.data;
      setPages(listOfPages);
    });
  }, [customerId, getFacebookPages]);

  return isLoadingPages ? (
    <Skeleton.Button />
  ) : (
    pages.map((page, index) => {
      return (
        <div
          key={index}
          className="flex flex-row items-center gap-2 border w-fit p-2 rounded-md"
        >
          <Avatar src={page.cover} alt={page.name} shape="square" size={50} />
          <Typography.Text>{page.name}</Typography.Text>
          <FacebookFilled style={{ fontSize: "2ch", color: "#1877F2" }} />
        </div>
      );
    })
  );
};

export default FacebookPages;
