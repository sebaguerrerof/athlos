import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
  DocumentReference,
  CollectionReference,
  Timestamp,
  serverTimestamp,
  WhereFilterOp,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Generic Firestore operations with TypeScript support
 */

/**
 * Get a single document by ID
 * @param collectionPath Path to collection (e.g., 'users', 'tenants/xxx/clients')
 * @param documentId Document ID
 */
export const getDocument = async <T = DocumentData>(
  collectionPath: string,
  documentId: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionPath, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionPath}:`, error);
    throw error;
  }
};

/**
 * Get multiple documents with optional filters
 * @param collectionPath Path to collection
 * @param constraints Query constraints (where, orderBy, limit, etc.)
 */
export const getDocuments = async <T = DocumentData>(
  collectionPath: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> => {
  try {
    const colRef = collection(db, collectionPath);
    const q = query(colRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
  } catch (error) {
    console.error(`Error getting documents from ${collectionPath}:`, error);
    throw error;
  }
};

/**
 * Create a new document with auto-generated ID
 * @param collectionPath Path to collection
 * @param data Document data
 */
export const createDocument = async <T = DocumentData>(
  collectionPath: string,
  data: Partial<T>
): Promise<string> => {
  try {
    const colRef = collection(db, collectionPath);
    const newDocRef = doc(colRef);
    
    const dataWithTimestamp = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(newDocRef, dataWithTimestamp);
    return newDocRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionPath}:`, error);
    throw error;
  }
};

/**
 * Create or update a document with specific ID
 * @param collectionPath Path to collection
 * @param documentId Document ID
 * @param data Document data
 */
export const setDocument = async <T = DocumentData>(
  collectionPath: string,
  documentId: string,
  data: Partial<T>,
  merge = true
): Promise<void> => {
  try {
    const docRef = doc(db, collectionPath, documentId);
    
    const dataWithTimestamp = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(docRef, dataWithTimestamp, { merge });
  } catch (error) {
    console.error(`Error setting document in ${collectionPath}:`, error);
    throw error;
  }
};

/**
 * Update an existing document
 * @param collectionPath Path to collection
 * @param documentId Document ID
 * @param data Partial document data to update
 */
export const updateDocument = async <T = DocumentData>(
  collectionPath: string,
  documentId: string,
  data: Partial<T>
): Promise<void> => {
  try {
    const docRef = doc(db, collectionPath, documentId);
    
    const dataWithTimestamp = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(docRef, dataWithTimestamp);
  } catch (error) {
    console.error(`Error updating document in ${collectionPath}:`, error);
    throw error;
  }
};

/**
 * Delete a document
 * @param collectionPath Path to collection
 * @param documentId Document ID
 */
export const deleteDocument = async (
  collectionPath: string,
  documentId: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionPath, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionPath}:`, error);
    throw error;
  }
};

/**
 * Helper: Build where constraint
 */
export const whereClause = (
  field: string,
  operator: WhereFilterOp,
  value: any
): QueryConstraint => {
  return where(field, operator, value);
};

/**
 * Helper: Build orderBy constraint
 */
export const orderByClause = (
  field: string,
  direction: 'asc' | 'desc' = 'asc'
): QueryConstraint => {
  return orderBy(field, direction);
};

/**
 * Helper: Build limit constraint
 */
export const limitClause = (count: number): QueryConstraint => {
  return limit(count);
};

/**
 * Convert Firestore Timestamp to Date
 */
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

/**
 * Convert Date to Firestore Timestamp
 */
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

export { db, serverTimestamp, Timestamp };
