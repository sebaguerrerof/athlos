import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '../../auth/AuthContext';
import { Exercise, CreateExerciseData } from '../types';

export const useExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const { tenant } = useAuth();

  useEffect(() => {
    if (!tenant?.id) {
      console.log('❌ No tenant ID for exercises');
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      try {
        console.log('🔑 Setting up exercises listener for tenant:', tenant.id);
        const exercisesRef = collection(db, 'tenants', tenant.id, 'exercises');
        const q = query(exercisesRef, orderBy('createdAt', 'desc'));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const exercisesData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Exercise[];
            console.log('💪 Exercises loaded:', exercisesData.length);
            setExercises(exercisesData);
            setLoading(false);
          },
          (error) => {
            console.error('Error loading exercises:', error);
            setExercises([]);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error setting up exercises listener:', error);
        setExercises([]);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        console.log('🧹 Cleaning up exercises listener');
        unsubscribe();
      }
    };
  }, [tenant?.id]);

  const addExercise = async (data: CreateExerciseData) => {
    if (!tenant?.id) {
      console.error('❌ No tenant ID when adding exercise');
      throw new Error('No tenant ID');
    }

    try {
      console.log('💾 Creating exercise with data:', data);
      const exercisesRef = collection(db, 'tenants', tenant.id, 'exercises');

      const exerciseData = {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(exercisesRef, exerciseData);
      console.log('✅ Exercise created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating exercise:', error);
      throw error;
    }
  };

  const updateExercise = async (
    id: string,
    updates: Partial<Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    if (!tenant?.id) {
      throw new Error('No tenant ID');
    }

    try {
      const exerciseRef = doc(db, 'tenants', tenant.id, 'exercises', id);
      await updateDoc(exerciseRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      console.log('✅ Exercise updated:', id);
    } catch (error) {
      console.error('Error updating exercise:', error);
      throw error;
    }
  };

  const deleteExercise = async (id: string) => {
    if (!tenant?.id) {
      throw new Error('No tenant ID');
    }

    try {
      const exerciseRef = doc(db, 'tenants', tenant.id, 'exercises', id);
      await deleteDoc(exerciseRef);
      console.log('✅ Exercise deleted:', id);
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw error;
    }
  };

  const getExercisesBySport = (sportType: string) => {
    return exercises.filter((exercise) => exercise.sportType === sportType);
  };

  const getExercisesByCategory = (category: Exercise['category']) => {
    return exercises.filter((exercise) => exercise.category === category);
  };

  return {
    exercises,
    loading,
    addExercise,
    updateExercise,
    deleteExercise,
    getExercisesBySport,
    getExercisesByCategory,
  };
};
