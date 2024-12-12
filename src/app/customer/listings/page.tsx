"use client";

import UserListingOptimization from "@/components/listings/UserListingOptimization";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerUpdate } from "@/hooks/useCustomer";
import { message } from "antd";
import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const ListingPage = () => {
  const { customerData } = useAuth();
  const { updateCustomer } = useCustomerUpdate();
  const searchParams = useSearchParams();
  const codeValue = searchParams.get("code");

  const handleSaveToken = useCallback(
    async (code: string) => {
      const response = await updateCustomer(customerData?.id as string, {
        etsyToken: code,
      });
      if (response) {
        message.success("Etsy Store connected successfully");
        window.location.href = window.location.pathname;
      }
    },
    [customerData?.id, updateCustomer],
  );

  useEffect(() => {
    if (codeValue && codeValue.length > 32) {
      handleSaveToken(codeValue);
    }
  }, [codeValue, handleSaveToken]);

  return (
    <UserListingOptimization
      showEtsyListings={customerData?.isSuperCustomer}
      showCreateListing={customerData?.isSuperCustomer}
      showDuplicatedListings={!customerData?.isSuperCustomer}
      showOptimizedListings={!customerData?.isSuperCustomer}
    />
  );
};

export default ListingPage;
