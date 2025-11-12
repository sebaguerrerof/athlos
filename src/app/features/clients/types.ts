/**
 * Client types for Sprint 2
 */

export interface Client {
  id: string;
  email: string;
  name: string;
  phone: string;
  status: 'invited' | 'active' | 'inactive';
  invitedAt: Date;
  acceptedAt: Date | null;
  notes?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientFormData {
  email: string;
  name: string;
  phone: string;
  notes?: string;
}

export type ClientStatus = 'invited' | 'active' | 'inactive';
