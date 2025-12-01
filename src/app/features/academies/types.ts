import { Timestamp } from 'firebase/firestore';

export interface Court {
  id: string;
  courtNumber: number;
  assignedCoachId: string;
  assignedCoachName: string;
  clientIds: string[]; // Max 4 for padel
  clientNames: string[];
}

export interface CoachAssignment {
  coachId: string;
  coachName: string;
  courtId: string;
  role: 'coach' | 'head-coach';
}

export interface Academy {
  id: string;
  name: string;
  sportType: string;
  description?: string;
  numberOfCourts: number;
  courtPrice: number; // Precio de la cancha
  pricePerStudent: number; // Precio por alumno
  headCoachId?: string; // Optional head coach watching from outside
  headCoachName?: string;
  courts: Court[];
  schedules: AcademySchedule[];
  exerciseIds: string[]; // IDs of assigned exercises
  status: 'active' | 'inactive' | 'completed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // tenant/professor who created it
}

export interface AcademySchedule {
  dayOfWeek: number; // 0-6
  startTime: string;
  endTime: string;
  duration: number; // minutes
  startDate: string; // ISO date
  endDate?: string; // ISO date for series end
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  materials?: string[]; // Equipment needed
  objectives: string[];
  category: 'warm-up' | 'drill' | 'game' | 'cool-down' | 'technique';
  sportType: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  videoUrl?: string;
  imageUrl?: string;
  instructions: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AcademySession {
  id: string;
  academyId: string;
  academyName: string;
  date: string; // ISO date
  startTime: string;
  endTime: string;
  courts: Court[];
  exerciseIds: string[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  attendance?: { [clientId: string]: boolean };
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateAcademyData {
  name: string;
  sportType: string;
  description?: string;
  numberOfCourts: number;
  courtPrice: number;
  pricePerStudent: number;
  headCoachId?: string;
  headCoachName?: string;
  courts: Omit<Court, 'id'>[];
  schedules: AcademySchedule[];
  exerciseIds?: string[];
}

export interface CreateExerciseData {
  name: string;
  description: string;
  duration?: number;
  materials?: string[];
  objectives: string[];
  category: 'warm-up' | 'drill' | 'game' | 'cool-down' | 'technique';
  sportType: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  videoUrl?: string;
  imageUrl?: string;
  instructions?: string;
}
