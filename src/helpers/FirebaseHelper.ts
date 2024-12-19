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
import { db, storage } from "@/firebase/config";
import { filterUndefined } from "@/utils/filterUndefined";
import { COLLECTIONS } from "@/config/collections";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

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

  async uploadImage(base64File: string, folder = "images"): Promise<string> {
    let downloadURL = "";
    if (base64File) {
      const matches = base64File.match(/^data:(image\/\w+);base64,/);
      const fileExtension = matches ? matches[1].split("/")[1] : "png";
      const base64Data = base64File.replace(/^data:image\/\w+;base64,/, "");
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length)
        .fill(0)
        .map((_, i) => byteCharacters.charCodeAt(i));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: `image/${fileExtension}`,
      });

      const uniqueFileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}.${fileExtension}`;
      const storageRef = ref(storage, `${folder}/${uniqueFileName}`);
      await uploadBytes(storageRef, blob);
      downloadURL = await getDownloadURL(storageRef);
    }

    return downloadURL;
  }
}

const FirebaseHelper = new FirebaseHandler();

export default FirebaseHelper;
