
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  DRIVER = 'DRIVER'
}

export enum JobStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED',
  REACHED = 'REACHED',
  ON_WORK = 'ON_WORK',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum DriverStatus {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  ON_LEAVE = 'ON_LEAVE'
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  status: string;
  password?: string;
  name: string;
}

export interface Vehicle {
  id: string;
  name: string;
  registrationNumber: string;
  status: VehicleStatus;
}

export interface Job {
  id: string;
  supervisorId: string;
  supervisorName: string;
  fromPlace: string;
  toPlace: string;
  date: string;
  timeSlot: string;
  purpose: string;
  priority: Priority;
  status: JobStatus;
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  vehicleName?: string;
  remarks?: string;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  timestamp: string;
}

export type Language = 'EN' | 'HI';
export type Theme = 'light' | 'dark';
