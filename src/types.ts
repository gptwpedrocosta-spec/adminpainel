export type UserRole = 'admin' | 'support' | 'customer';
export type UserStatus = 'active' | 'blocked' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  documentPhoto?: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  isOnline?: boolean;
  currentLocation?: { lat: number; lng: number };
}

export type DriverStatus = 'pending' | 'approved' | 'rejected' | 'inactive';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  cnhPhotoUrl?: string;
  crlvPhotoUrl?: string;
  vehicle: {
    model: string;
    licensePlate: string;
    color: string;
    brand?: string;
    year?: number;
    renavam?: string;
    crlv?: string;
  };
  documents: {
    licenseUrl: string;
    vehicleDocUrl: string;
  };
  status: DriverStatus;
  isOnline: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    bearing?: number;
  };
  rating: number;
  createdAt: string;
}

export type RideStatus = 'waiting' | 'accepted' | 'in_progress' | 'finished' | 'canceled';

export interface Ride {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  originAddress: string;
  destAddress: string;
  originLatLng: { lat: number; lng: number };
  destLatLng: { lat: number; lng: number };
  distance: number; // in km
  duration: number; // in minutes
  price: number; // total cost
  fee: number; // platform fee
  status: RideStatus;
  type: 'ride' | 'delivery';
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryDetails {
  id: string;
  rideId: string;
  senderName: string;
  receiverName: string;
  receiverPhone: string;
  itemDescription: string;
  status: RideStatus;
  createdAt: string;
}

export interface Wallet {
  id: string; // matches userId or driverId or 'platform'
  userId?: string;
  driverId?: string;
  balance: number;
  type: 'customer' | 'driver' | 'platform';
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  referenceId?: string; // rideId, etc
  createdAt: string;
}

export interface Admin {
  id: string;
  uid?: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  documentPhoto?: string;
  role: 'super_admin' | 'admin' | 'support' | 'financial' | 'operator';
  status: 'active' | 'inactive' | 'suspended';
  active?: boolean;
  permissions?: string[];
  createdAt?: string;
}

export interface CompanyPlan {
  id: string; // 'basic' | 'corporate' | 'premium'
  name: string;
  monthlyValue: number;
  rideLimit: number;
  discountPercent: number;
  customRatePerKm: number;
  employeeLimit: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'blocked';
  createdAt: string;
}

export interface Company {
  id: string;
  companyName: string; // Razão social
  tradingName: string; // Nome fantasia
  cnpj: string;
  stateRegistration: string; // Inscrição estadual
  corporateEmail: string;
  phone: string;
  address: string;
  logoUrl?: string;
  cnpjPhotoUrl?: string;
  contractPhotoUrl?: string;
  responsibleName: string;
  responsibleRole: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminUid?: string;
  planId: 'basic' | 'corporate' | 'premium';
  status: 'active' | 'blocked' | 'pending';
  monthlyLimit: number;
  spentThisMonth: number;
  specialRatePerKm?: number;
  employees?: Employee[];
  createdAt: string;
}
