import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// const firebaseConfig = {
//   apiKey: "AIzaSyDckKYqZNT4bdE51UoxFu9Mglc6ZDLnFTM",
//   authDomain: "goopss-testing.firebaseapp.com",
//   projectId: "goopss-testing",
//   storageBucket: "goopss-testing.firebasestorage.app",
//   messagingSenderId: "727749770526",
//   appId: "1:727749770526:web:de63a4f5c5af53837c5d0f",
// };
// LIVE
const firebaseConfig = {
  apiKey: "AIzaSyAxrhmVhtFCRVWp_ZwQMXRNBryoRn7RS0I",
  authDomain: "goopss-user-admin-dashboard.firebaseapp.com",
  projectId: "goopss-user-admin-dashboard",
  storageBucket: "goopss-user-admin-dashboard.appspot.com",
  messagingSenderId: "163336972796",
  appId: "1:163336972796:web:4dda62af9ec6436f2dea79"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

console.log("Firebase initialized:", app);
console.log("Firestore initialized:", db);
console.log("Storage initialized:", storage);
