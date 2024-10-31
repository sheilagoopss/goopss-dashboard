/* eslint-disable react-hooks/exhaustive-deps */
import { Layout } from "antd";
import { useAuth } from "contexts/AuthContext";
import DesignHubAdmin from "./views/DesignHubAdmin";
import DesignHubCustomer from "./views/DesignHubCustomer";

const { Content } = Layout;

const DesignHub = () => {
  const { isAdmin } = useAuth();

  return (
    <Layout style={{ background: "none" }}>
      <Content style={{ padding: "24px" }}>
        {isAdmin ? <DesignHubAdmin /> : <DesignHubCustomer />}
      </Content>
    </Layout>
  );
};

export default DesignHub;
