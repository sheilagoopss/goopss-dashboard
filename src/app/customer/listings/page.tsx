"use client";

import UserListingOptimization from "@/components/listings/UserListingOptimization";
import { useAuth } from "@/contexts/AuthContext";

const ListingPage = () => {
  const { customerData } = useAuth();

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
