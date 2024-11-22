/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import StoreAnalysisCustomer from "./view/StoreAnalysisCustomer";
import StoreAnalysisAdmin from "./view/StoreAnalysisAdmin";

const StoreAnalysis: React.FC = () => {
  const { isAdmin } = useAuth();

  return isAdmin ? <StoreAnalysisAdmin /> : <StoreAnalysisCustomer />;
};

export default StoreAnalysis;
