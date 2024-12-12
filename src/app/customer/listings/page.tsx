"use client";

import UserListingOptimization from "@/components/listings/UserListingOptimization";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";

const ListingPage = () => {
  const { customerData } = useAuth();
  const params = useSearchParams();
  const code = params.get("code");

  return (
    <UserListingOptimization
      showEtsyListings={customerData?.isSuperCustomer}
      showCreateListing={customerData?.isSuperCustomer}
      showDuplicatedListings={!customerData?.isSuperCustomer}
      showOptimizedListings={!customerData?.isSuperCustomer}
      initialTab={code ? "create" : "optimized"}
    />
  );
};

export default ListingPage;
