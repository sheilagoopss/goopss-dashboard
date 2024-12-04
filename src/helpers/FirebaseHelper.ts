import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { filterUndefined } from "@/utils/filterUndefined";
import { COLLECTIONS } from "@/config/collections";

class FirebaseHandler {
  private db: Firestore;

  constructor() {
    this.db = db;
  }

  async findOne<T>(
    collectionName: keyof typeof COLLECTIONS,
    id: string,
  ): Promise<T | null> {
    const docRef = doc(this.db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docRef.id, ...(docSnap.data() as T) };
    } else {
      return null;
    }
  }

  async find<T>(collectionName: keyof typeof COLLECTIONS): Promise<T[]> {
    const querySnapshot = await getDocs(collection(this.db, collectionName));
    const data: T[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as T);
    });
    return data;
  }

  async findWithFilter<T>(
    collectionName: keyof typeof COLLECTIONS,
    field: keyof T,
    value: any,
  ): Promise<T[]> {
    const q = query(
      collection(this.db, collectionName),
      where(field as string, "==", value),
    );
    const querySnapshot = await getDocs(q);
    const data: T[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...(doc.data() as T) });
    });
    return data;
  }

  async create(
    collectionName: keyof typeof COLLECTIONS,
    data: any,
  ): Promise<any> {
    const docRef = await addDoc(collection(this.db, collectionName), data);
    return docRef;
  }

  async update(
    collectionName: keyof typeof COLLECTIONS,
    id: string,
    data: any,
  ): Promise<boolean> {
    try {
      const document = doc(db, collectionName, id);
      const existingDoc = await getDoc(document);
      if (!existingDoc.exists()) {
        return false;
      }
      const docRef = doc(this.db, collectionName, id);
      const sanitizedData = filterUndefined(data);
      await setDoc(docRef, sanitizedData, { merge: true });
      return true;
    } catch (error) {
      console.error("Error updating:", error);
      return false;
    }
  }

  async delete(
    collectionName: keyof typeof COLLECTIONS,
    id: string,
  ): Promise<void> {
    await deleteDoc(doc(this.db, collectionName, id));
  }
}

const FirebaseHelper = new FirebaseHandler();

export default FirebaseHelper;
