import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

export async function addCustomers() {
  const customersCollection = collection(db, "customers");

  const customers = [
    {
      customerId: "001",
      storeName: "Awesome Store",
      storeOwnerName: "John Doe",
    },
    { customerId: "002", storeName: "Cool Shop", storeOwnerName: "Jane Smith" },
  ];

  for (const customer of customers) {
    await addDoc(customersCollection, customer);
  }

  console.log("Customers added successfully");
}
