import { doc, setDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface CreateTenantData {
  userId: string;
  email: string;
  displayName: string;
  businessName: string;
  businessType?: 'gym' | 'clinic' | 'personal_training' | 'other';
}

/**
 * Create tenant and user documents in Firestore
 * This is a fallback when Cloud Functions are not available
 */
export const createTenantAndUser = async (data: CreateTenantData) => {
  try {
    // Check if user already exists
    const userDoc = await getDoc(doc(db, 'users', data.userId));
    if (userDoc.exists()) {
      console.log('User already exists, skipping creation');
      const userData = userDoc.data();
      return { tenantId: userData.tenantId, userId: data.userId };
    }

    // Create tenant document
    const tenantRef = doc(collection(db, 'tenants'));
    const tenantId = tenantRef.id;

    await setDoc(tenantRef, {
      name: data.businessName,
      ownerId: data.userId,
      plan: 'free',
      settings: {
        businessName: data.businessName,
        businessType: data.businessType || 'other',
        timezone: 'America/Santiago',
        currency: 'CLP',
        features: {
          calendar: true,
          payments: true,
          routines: true,
          activities: true,
        },
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
    });

    console.log(`Tenant created with ID: ${tenantId}`);

    // Create user document
    await setDoc(doc(db, 'users', data.userId), {
      uid: data.userId,
      email: data.email,
      displayName: data.displayName,
      photoURL: '',
      role: 'owner',
      tenantId: tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      emailVerified: false,
      isActive: true,
    });

    console.log(`User document created for ${data.userId}`);

    return { tenantId, userId: data.userId };
  } catch (error) {
    console.error('Error creating tenant and user:', error);
    throw error;
  }
};
