import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  query, 
  orderBy, 
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  increment,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, Driver, Ride, DeliveryDetails, Wallet, Transaction, RideStatus, Admin, Company, CompanyPlan } from '../types';

// Real-time subscriptions
export function subscribeToUsers(onUpdate: (users: User[]) => void, onError?: (err: Error) => void) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const users: User[] = [];
    snapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as User);
    });
    onUpdate(users);
  }, (err) => {
    console.error("Erro no onSnapshot de Users:", err);
    if (onError) onError(err);
  });
}

export function subscribeToDrivers(onUpdate: (drivers: Driver[]) => void, onError?: (err: Error) => void) {
  const q = query(collection(db, 'drivers'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const drivers: Driver[] = [];
    snapshot.forEach((doc) => {
      drivers.push({ id: doc.id, ...doc.data() } as Driver);
    });
    onUpdate(drivers);
  }, (err) => {
    console.error("Erro no onSnapshot de Drivers:", err);
    if (onError) onError(err);
  });
}

export function subscribeToRides(onUpdate: (rides: Ride[]) => void, onError?: (err: Error) => void) {
  const q = query(collection(db, 'rides'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const rides: Ride[] = [];
    snapshot.forEach((doc) => {
      rides.push({ id: doc.id, ...doc.data() } as Ride);
    });
    onUpdate(rides);
  }, (err) => {
    console.error("Erro no onSnapshot de Rides:", err);
    if (onError) onError(err);
  });
}

export function subscribeToDeliveries(onUpdate: (deliveries: DeliveryDetails[]) => void, onError?: (err: Error) => void) {
  const q = query(collection(db, 'deliveries'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const deliveries: DeliveryDetails[] = [];
    snapshot.forEach((doc) => {
      deliveries.push({ id: doc.id, ...doc.data() } as DeliveryDetails);
    });
    onUpdate(deliveries);
  }, (err) => {
    console.error("Erro no onSnapshot de Deliveries:", err);
    if (onError) onError(err);
  });
}

export function subscribeToWallets(onUpdate: (wallets: Wallet[]) => void, onError?: (err: Error) => void) {
  return onSnapshot(collection(db, 'wallets'), (snapshot) => {
    const wallets: Wallet[] = [];
    snapshot.forEach((doc) => {
      wallets.push({ id: doc.id, ...doc.data() } as Wallet);
    });
    onUpdate(wallets);
  }, (err) => {
    console.error("Erro no onSnapshot de Wallets:", err);
    if (onError) onError(err);
  });
}

export function subscribeToTransactions(onUpdate: (txs: Transaction[]) => void, onError?: (err: Error) => void) {
  const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const txs: Transaction[] = [];
    snapshot.forEach((doc) => {
      txs.push({ id: doc.id, ...doc.data() } as Transaction);
    });
    onUpdate(txs);
  }, (err) => {
    console.error("Erro no onSnapshot de Transactions:", err);
    if (onError) onError(err);
  });
}

export async function toggleUserOnline(userId: string, isOnline: boolean): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { isOnline });
}

export async function updateUserLocation(userId: string, lat: number, lng: number): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    currentLocation: { lat, lng }
  });
}

// Mutations
export async function updateUserStatus(userId: string, status: 'active' | 'blocked' | 'pending'): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { status });
}

export async function updateDriverStatus(driverId: string, status: 'approved' | 'rejected' | 'inactive' | 'pending'): Promise<void> {
  const driverRef = doc(db, 'drivers', driverId);
  await updateDoc(driverRef, { status });
}

export async function toggleDriverOnline(driverId: string, isOnline: boolean): Promise<void> {
  const driverRef = doc(db, 'drivers', driverId);
  await updateDoc(driverRef, { isOnline });
}

export async function updateDriverLocation(driverId: string, lat: number, lng: number): Promise<void> {
  const driverRef = doc(db, 'drivers', driverId);
  await updateDoc(driverRef, {
    currentLocation: { lat, lng }
  });
}

export async function updateRideStatus(rideId: string, status: Ride['status']): Promise<void> {
  const rideRef = doc(db, 'rides', rideId);
  await updateDoc(rideRef, { 
    status,
    updatedAt: new Date().toISOString()
  });

  // If a ride is finished, we should update wallets and transactions in a real system!
  if (status === 'finished') {
    try {
      const rideSnap = await getDoc(rideRef);
      if (rideSnap.exists()) {
        const ride = rideSnap.data() as Ride;
        const driverId = ride.driverId;
        const userId = ride.userId;
        const amount = ride.price;
        const fee = ride.fee;
        const driverEarnings = amount - fee;

        const batch = writeBatch(db);

        // Deduct from customer wallet
        const userWalletRef = doc(db, 'wallets', userId);
        batch.set(userWalletRef, {
          balance: increment(-amount),
          lastUpdated: new Date().toISOString()
        }, { merge: true });

        // Credit to driver wallet
        if (driverId) {
          const driverWalletRef = doc(db, 'wallets', driverId);
          batch.set(driverWalletRef, {
            balance: increment(driverEarnings),
            lastUpdated: new Date().toISOString()
          }, { merge: true });
        }

        // Credit to platform wallet
        const platformWalletRef = doc(db, 'wallets', 'platform');
        batch.set(platformWalletRef, {
          balance: increment(fee),
          lastUpdated: new Date().toISOString()
        }, { merge: true });

        // Add Transactions
        const txCol = collection(db, 'transactions');
        const tx1Ref = doc(txCol);
        batch.set(tx1Ref, {
          id: tx1Ref.id,
          walletId: userId,
          amount,
          type: 'debit',
          description: `Corrida finalizada #${rideId}`,
          referenceId: rideId,
          createdAt: new Date().toISOString()
        });

        if (driverId) {
          const tx2Ref = doc(txCol);
          batch.set(tx2Ref, {
            id: tx2Ref.id,
            walletId: driverId,
            amount: driverEarnings,
            type: 'credit',
            description: `Ganhos da Corrida #${rideId}`,
            referenceId: rideId,
            createdAt: new Date().toISOString()
          });
        }

        const tx3Ref = doc(txCol);
        batch.set(tx3Ref, {
          id: tx3Ref.id,
          walletId: 'platform',
          amount: fee,
          type: 'credit',
          description: `Taxa da Corrida #${rideId}`,
          referenceId: rideId,
          createdAt: new Date().toISOString()
        });

        await batch.commit();
      }
    } catch (err) {
      console.error("Erro ao processar transações financeiras de corrida finalizada:", err);
    }
  }
}

export async function createManualRide(rideData: Partial<Ride>): Promise<string> {
  const rideCol = collection(db, 'rides');
  const docRef = doc(rideCol);
  const now = new Date().toISOString();
  
  const fullRide: Ride = {
    id: docRef.id,
    userId: rideData.userId || 'usr_1',
    userName: rideData.userName || 'Ana Beatriz Souza',
    userPhone: rideData.userPhone || '(11) 98765-4321',
    driverId: rideData.driverId,
    driverName: rideData.driverName,
    driverPhone: rideData.driverPhone,
    originAddress: rideData.originAddress || 'Av. Paulista, 1000 - São Paulo',
    destAddress: rideData.destAddress || 'Rua Augusta, 1500 - São Paulo',
    originLatLng: rideData.originLatLng || { lat: -23.561524, lng: -46.655881 },
    destLatLng: rideData.destLatLng || { lat: -23.558359, lng: -46.660164 },
    distance: rideData.distance || 2.5,
    duration: rideData.duration || 10,
    price: rideData.price || 15.00,
    fee: rideData.fee || 3.00,
    status: rideData.status as RideStatus || 'waiting',
    type: rideData.type as 'ride' | 'delivery' || 'ride',
    createdAt: now,
    updatedAt: now
  };

  await setDoc(docRef, fullRide);

  if (fullRide.type === 'delivery') {
    const delCol = collection(db, 'deliveries');
    const delRef = doc(delCol);
    const delDetails: DeliveryDetails = {
      id: delRef.id,
      rideId: fullRide.id,
      senderName: fullRide.userName,
      receiverName: 'Destinatário Manual',
      receiverPhone: '(11) 90000-0000',
      itemDescription: 'Pacote criado manualmente via painel admin',
      status: fullRide.status,
      createdAt: now
    };
    await setDoc(delRef, delDetails);
  }

  return docRef.id;
}

export async function sendPushNotification(title: string, body: string, target: 'all' | 'drivers' | 'users' | string): Promise<void> {
  console.log(`[PUSH NOTIFICATION] Enviado para [${target}]: ${title} - ${body}`);
  // In a real system, we'd trigger a Firebase Cloud Function or use Admin SDK messaging.
  // We'll write to a "notifications_log" collection to demonstrate proper Firebase storage integration!
  const notifCol = collection(db, 'notifications_log');
  await addDoc(notifCol, {
    title,
    body,
    target,
    createdAt: new Date().toISOString()
  });
}

export async function seedInitialData(): Promise<void> {
  const batch = writeBatch(db);

  const now = new Date();
  const dateStr = (offsetHours: number) => {
    const d = new Date(now.getTime() - offsetHours * 60 * 60 * 1000);
    return d.toISOString();
  };

  // 1. System Settings
  const configRef = doc(db, 'system_settings', 'config');
  batch.set(configRef, {
    baseFare: 5.00,
    pricePerKm: 2.00,
    platformFeePercent: 20,
    minimumFare: 8.00,
    dynamicMultiplier: 1.0,
    cityBoundaries: 'São Paulo - SP (Metropolitana)',
    updatedAt: dateStr(0)
  });

  // 2. Users
  const usersData: User[] = [
    {
      id: 'usr_1',
      name: 'Ana Beatriz Souza',
      email: 'ana.beatriz@email.com',
      phone: '(11) 98765-4321',
      status: 'active',
      role: 'customer',
      createdAt: dateStr(48),
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Ana%20Beatriz',
      isOnline: true,
      currentLocation: { lat: -23.563211, lng: -46.654124 }
    },
    {
      id: 'usr_2',
      name: 'Carlos Eduardo Lima',
      email: 'carlos.lima@email.com',
      phone: '(11) 91234-5678',
      status: 'active',
      role: 'customer',
      createdAt: dateStr(36),
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Carlos%20Lima',
      isOnline: true,
      currentLocation: { lat: -23.565124, lng: -46.651214 }
    },
    {
      id: 'usr_3',
      name: 'Mariana Rocha',
      email: 'mariana.rocha@email.com',
      phone: '(11) 97777-8888',
      status: 'active',
      role: 'customer',
      createdAt: dateStr(24),
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Mariana%20Rocha',
      isOnline: true,
      currentLocation: { lat: -23.559124, lng: -46.661214 }
    },
    {
      id: 'usr_4',
      name: 'Bruno Silveira',
      email: 'bruno.silv@email.com',
      phone: '(11) 96666-5555',
      status: 'blocked',
      role: 'customer',
      createdAt: dateStr(12),
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Bruno%20Silveira',
      isOnline: false,
      currentLocation: { lat: -23.554211, lng: -46.663124 }
    },
    {
      id: 'usr_5',
      name: 'Juliana Alencar',
      email: 'juliana.a@email.com',
      phone: '(11) 95555-4444',
      status: 'active',
      role: 'customer',
      createdAt: dateStr(2),
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Juliana%20Alencar',
      isOnline: true,
      currentLocation: { lat: -23.567124, lng: -46.648124 }
    }
  ];

  usersData.forEach(user => {
    batch.set(doc(db, 'users', user.id), user);
  });

  // 3. Drivers
  const driversData: Driver[] = [
    {
      id: 'drv_1',
      name: 'Rodrigo Santos (Piloto)',
      email: 'rodrigo.santos@email.com',
      phone: '(11) 99888-7777',
      rating: 4.9,
      status: 'approved',
      isOnline: true,
      vehicle: {
        model: 'Honda CB 300F Twister',
        licensePlate: 'MJA-3B12',
        color: 'Azul'
      },
      documents: {
        licenseUrl: 'https://firebasestorage.googleapis.com/v0/b/mock-cnh.jpg',
        vehicleDocUrl: 'https://firebasestorage.googleapis.com/v0/b/mock-crlv.jpg'
      },
      currentLocation: { lat: -23.561524, lng: -46.655881, bearing: 90 },
      createdAt: dateStr(72),
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Rodrigo%20Santos'
    },
    {
      id: 'drv_2',
      name: 'Marcelo Oliveira',
      email: 'marcelo.oli@email.com',
      phone: '(11) 99111-2222',
      rating: 4.7,
      status: 'approved',
      isOnline: true,
      vehicle: {
        model: 'Yamaha Fazer 250',
        licensePlate: 'MJA-7X45',
        color: 'Preta'
      },
      documents: {
        licenseUrl: 'https://firebasestorage.googleapis.com/v0/b/mock-cnh.jpg',
        vehicleDocUrl: 'https://firebasestorage.googleapis.com/v0/b/mock-crlv.jpg'
      },
      currentLocation: { lat: -23.558359, lng: -46.660164, bearing: 180 },
      createdAt: dateStr(60),
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Marcelo%20Oliveira'
    },
    {
      id: 'drv_3',
      name: 'Fernando Henrique',
      email: 'fernando.h@email.com',
      phone: '(11) 98888-5555',
      rating: 4.8,
      status: 'approved',
      isOnline: false,
      vehicle: {
        model: 'Honda CG 160 Titan',
        licensePlate: 'MJA-9Y88',
        color: 'Vermelha'
      },
      documents: {
        licenseUrl: 'https://firebasestorage.googleapis.com/v0/b/mock-cnh.jpg',
        vehicleDocUrl: 'https://firebasestorage.googleapis.com/v0/b/mock-crlv.jpg'
      },
      currentLocation: { lat: -23.590211, lng: -46.672412 },
      createdAt: dateStr(48),
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Fernando%20Henrique'
    },
    {
      id: 'drv_4',
      name: 'Patricia Lima',
      email: 'patricia.l@email.com',
      phone: '(11) 97777-4444',
      rating: 5.0,
      status: 'pending',
      isOnline: false,
      vehicle: {
        model: 'Yamaha Lander 250',
        licensePlate: 'MJA-1A90',
        color: 'Azul'
      },
      documents: {
        licenseUrl: 'https://firebasestorage.googleapis.com/v0/b/mock-cnh.jpg',
        vehicleDocUrl: 'https://firebasestorage.googleapis.com/v0/b/mock-crlv.jpg'
      },
      currentLocation: { lat: -23.543209, lng: -46.629211 },
      createdAt: dateStr(12),
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Patricia%20Lima'
    }
  ];

  driversData.forEach(driver => {
    batch.set(doc(db, 'drivers', driver.id), driver);
  });

  // 4. Rides & Deliveries
  const ridesData: Ride[] = [
    {
      id: 'ride_1',
      userId: 'usr_1',
      userName: 'Ana Beatriz Souza',
      userPhone: '(11) 98765-4321',
      driverId: 'drv_1',
      driverName: 'Rodrigo Santos (Piloto)',
      driverPhone: '(11) 99888-7777',
      originAddress: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      destAddress: 'Rua Augusta, 1500 - Consolação, São Paulo - SP',
      originLatLng: { lat: -23.561524, lng: -46.655881 },
      destLatLng: { lat: -23.558359, lng: -46.660164 },
      distance: 2.1,
      duration: 8,
      price: 12.50,
      fee: 2.50,
      status: 'finished',
      type: 'ride',
      createdAt: dateStr(4),
      updatedAt: dateStr(3.8)
    },
    {
      id: 'ride_2',
      userId: 'usr_2',
      userName: 'Carlos Eduardo Lima',
      userPhone: '(11) 91234-5678',
      driverId: 'drv_2',
      driverName: 'Marcelo Oliveira',
      driverPhone: '(11) 99111-2222',
      originAddress: 'Rua Tabapuã, 500 - Itaim Bibi, São Paulo - SP',
      destAddress: 'Av. Rebouças, 3970 - Pinheiros, São Paulo - SP',
      originLatLng: { lat: -23.585124, lng: -46.679124 },
      destLatLng: { lat: -23.570112, lng: -46.696112 },
      distance: 3.8,
      duration: 12,
      price: 18.20,
      fee: 3.64,
      status: 'finished',
      type: 'ride',
      createdAt: dateStr(3),
      updatedAt: dateStr(2.8)
    },
    {
      id: 'ride_3',
      userId: 'usr_3',
      userName: 'Mariana Rocha',
      userPhone: '(11) 97777-8888',
      driverId: 'drv_3',
      driverName: 'Fernando Henrique',
      driverPhone: '(11) 98888-5555',
      originAddress: 'Av. Brig. Luís Antônio, 2200 - Bela Vista, São Paulo - SP',
      destAddress: 'Parque do Ibirapuera, Portão 3 - SP',
      originLatLng: { lat: -23.565124, lng: -46.651214 },
      destLatLng: { lat: -23.588124, lng: -46.658124 },
      distance: 4.5,
      duration: 15,
      price: 22.00,
      fee: 4.40,
      status: 'canceled',
      type: 'ride',
      createdAt: dateStr(2),
      updatedAt: dateStr(1.9)
    },
    {
      id: 'ride_4',
      userId: 'usr_5',
      userName: 'Juliana Alencar',
      userPhone: '(11) 95555-4444',
      originAddress: 'Rua da Consolação, 2300 - Cerqueira César, São Paulo - SP',
      destAddress: 'Metrô Santa Cruz - Vila Mariana, São Paulo - SP',
      originLatLng: { lat: -23.559124, lng: -46.661214 },
      destLatLng: { lat: -23.599124, lng: -46.637124 },
      distance: 6.7,
      duration: 18,
      price: 28.50,
      fee: 5.70,
      status: 'waiting',
      type: 'ride',
      createdAt: dateStr(0.5),
      updatedAt: dateStr(0.5)
    },
    {
      id: 'ride_5',
      userId: 'usr_1',
      userName: 'Ana Beatriz Souza',
      userPhone: '(11) 98765-4321',
      driverId: 'drv_1',
      driverName: 'Rodrigo Santos (Piloto)',
      driverPhone: '(11) 99888-7777',
      originAddress: 'Av. Paulista, 1500 - Bela Vista, São Paulo - SP',
      destAddress: 'Rua Augusta, 500 - Consolação, São Paulo - SP',
      originLatLng: { lat: -23.561524, lng: -46.655881 },
      destLatLng: { lat: -23.551124, lng: -46.662124 },
      distance: 1.8,
      duration: 6,
      price: 11.20,
      fee: 2.24,
      status: 'in_progress',
      type: 'delivery',
      createdAt: dateStr(0.1),
      updatedAt: dateStr(0.1)
    }
  ];

  ridesData.forEach(ride => {
    batch.set(doc(db, 'rides', ride.id), ride);
  });

  // Delivery details for ride_5
  const deliveryDetail: DeliveryDetails = {
    id: 'del_1',
    rideId: 'ride_5',
    senderName: 'Ana Beatriz Souza',
    receiverName: 'Carlos Henrique (Escritório)',
    receiverPhone: '(11) 94444-3333',
    itemDescription: 'Documentos urgentes de cartório e chaves',
    status: 'in_progress',
    createdAt: dateStr(0.1)
  };
  batch.set(doc(db, 'deliveries', deliveryDetail.id), deliveryDetail);

  // 5. Wallets
  const walletsData: Wallet[] = [
    { id: 'usr_1', balance: 150.00, type: 'customer', lastUpdated: dateStr(0) },
    { id: 'usr_2', balance: 80.00, type: 'customer', lastUpdated: dateStr(0) },
    { id: 'usr_3', balance: 200.00, type: 'customer', lastUpdated: dateStr(0) },
    { id: 'usr_4', balance: 0.00, type: 'customer', lastUpdated: dateStr(0) },
    { id: 'usr_5', balance: 45.00, type: 'customer', lastUpdated: dateStr(0) },
    { id: 'drv_1', balance: 110.00, type: 'driver', lastUpdated: dateStr(0) },
    { id: 'drv_2', balance: 145.56, type: 'driver', lastUpdated: dateStr(0) },
    { id: 'drv_3', balance: 0.00, type: 'driver', lastUpdated: dateStr(0) },
    { id: 'drv_4', balance: 0.00, type: 'driver', lastUpdated: dateStr(0) },
    { id: 'platform', balance: 6.14, type: 'platform', lastUpdated: dateStr(0) } // sum of completed fees (2.50 from ride_1 + 3.64 from ride_2)
  ];

  walletsData.forEach(wallet => {
    batch.set(doc(db, 'wallets', wallet.id), wallet);
  });

  // 6. Transactions
  const txCol = collection(db, 'transactions');
  
  // Transactions for Ride 1 (finished)
  const txs: any[] = [
    {
      id: 'tx_1',
      walletId: 'usr_1',
      amount: 12.50,
      type: 'debit',
      description: 'Corrida finalizada #ride_1',
      referenceId: 'ride_1',
      createdAt: dateStr(3.8)
    },
    {
      id: 'tx_2',
      walletId: 'drv_1',
      amount: 10.00, // 12.50 - 2.50
      type: 'credit',
      description: 'Ganhos da Corrida #ride_1',
      referenceId: 'ride_1',
      createdAt: dateStr(3.8)
    },
    {
      id: 'tx_3',
      walletId: 'platform',
      amount: 2.50,
      type: 'credit',
      description: 'Taxa da Corrida #ride_1',
      referenceId: 'ride_1',
      createdAt: dateStr(3.8)
    },
    // Transactions for Ride 2 (finished)
    {
      id: 'tx_4',
      walletId: 'usr_2',
      amount: 18.20,
      type: 'debit',
      description: 'Corrida finalizada #ride_2',
      referenceId: 'ride_2',
      createdAt: dateStr(2.8)
    },
    {
      id: 'tx_5',
      walletId: 'drv_2',
      amount: 14.56, // 18.20 - 3.64
      type: 'credit',
      description: 'Ganhos da Corrida #ride_2',
      referenceId: 'ride_2',
      createdAt: dateStr(2.8)
    },
    {
      id: 'tx_6',
      walletId: 'platform',
      amount: 3.64,
      type: 'credit',
      description: 'Taxa da Corrida #ride_2',
      referenceId: 'ride_2',
      createdAt: dateStr(2.8)
    }
  ];

  txs.forEach(tx => {
    batch.set(doc(txCol, tx.id), tx);
  });

  // Push notification log
  const notifCol = collection(db, 'notifications_log');
  batch.set(doc(notifCol, 'notif_1'), {
    id: 'notif_1',
    title: 'Campanha de Inverno MotoJá',
    body: 'Piloto, aproveite o multiplicador dinâmico ativo hoje das 18h às 21h em toda SP!',
    target: 'drivers',
    createdAt: dateStr(24)
  });

  batch.set(doc(notifCol, 'notif_2'), {
    id: 'notif_2',
    title: 'Desconto de Boas-vindas',
    body: 'Ganhe 15% de desconto em sua primeira viagem de moto com o código MOTO15!',
    target: 'users',
    createdAt: dateStr(18)
  });

  await batch.commit();
}

// ==========================================
// CORPORATE OPERATIONS & SECURITY ENGINE
// ==========================================

// Audit Logs
export async function logAdminAction(adminEmail: string, actionDescription: string): Promise<void> {
  try {
    const logCol = collection(db, 'audit_logs');
    await addDoc(logCol, {
      adminEmail,
      actionDescription,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Erro ao registrar log de auditoria:", err);
  }
}

export function subscribeToAuditLogs(onUpdate: (logs: any[]) => void) {
  const q = query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const logs: any[] = [];
    snapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...docSnap.data() });
    });
    onUpdate(logs);
  });
}

// Admins & Dynamic Permissions Matrix
export async function createAdminProfile(
  uid: string, 
  email: string, 
  name: string, 
  role: string, 
  permissions: string[],
  avatarUrl?: string,
  documentPhoto?: string
): Promise<void> {
  const adminRef = doc(db, 'admins', uid);
  await setDoc(adminRef, {
    uid,
    email,
    name,
    role,
    permissions,
    avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    documentPhoto: documentPhoto || '',
    createdAt: new Date().toISOString()
  });
}

export function subscribeToAdmins(onUpdate: (admins: any[]) => void) {
  const q = query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const admins: any[] = [];
    snapshot.forEach((docSnap) => {
      admins.push({ id: docSnap.id, ...docSnap.data() });
    });
    onUpdate(admins);
  });
}

export async function updateAdminPermissions(uid: string, permissions: string[]): Promise<void> {
  const adminRef = doc(db, 'admins', uid);
  await updateDoc(adminRef, { permissions });
}

// Passenger Creation (Real Integration)
export async function createPassenger(passenger: { 
  name: string; 
  cpf: string; 
  phone: string; 
  email: string;
  avatarUrl?: string;
  documentPhoto?: string;
}): Promise<void> {
  const passengerId = `usr_${Date.now()}`;
  const userRef = doc(db, 'users', passengerId);
  
  await setDoc(userRef, {
    id: passengerId,
    name: passenger.name,
    email: passenger.email,
    phone: passenger.phone,
    cpf: passenger.cpf,
    role: 'customer',
    status: 'active',
    createdAt: new Date().toISOString(),
    avatarUrl: passenger.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(passenger.name)}`,
    documentPhoto: passenger.documentPhoto || ''
  });

  // Create associated wallet
  const walletRef = doc(db, 'wallets', passengerId);
  await setDoc(walletRef, {
    id: passengerId,
    type: 'customer',
    balance: 0.0,
    lastUpdated: new Date().toISOString()
  });
}

// Driver Creation (Real Integration)
export async function createDriver(driver: {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cnh: string;
  ear: boolean;
  vehicle: {
    model: string;
    year: string;
    color: string;
    licensePlate: string;
  };
  avatarUrl?: string;
  cnhPhotoUrl?: string;
  crlvPhotoUrl?: string;
}): Promise<void> {
  const driverId = `drv_${Date.now()}`;
  const driverRef = doc(db, 'drivers', driverId);

  await setDoc(driverRef, {
    id: driverId,
    name: driver.name,
    email: driver.email,
    phone: driver.phone,
    cpf: driver.cpf,
    status: 'pending', // Pending approval by default
    isOnline: false,
    rating: 5.0,
    cnh: driver.cnh,
    ear: driver.ear,
    createdAt: new Date().toISOString(),
    avatarUrl: driver.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(driver.name)}`,
    vehicle: {
      ...driver.vehicle,
      crlvUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=400"
    },
    cnhPhotoUrl: driver.cnhPhotoUrl || '',
    crlvPhotoUrl: driver.crlvPhotoUrl || ''
  });

  // Create associated wallet
  const walletRef = doc(db, 'wallets', driverId);
  await setDoc(walletRef, {
    id: driverId,
    type: 'driver',
    balance: 0.0,
    lastUpdated: new Date().toISOString()
  });
}

// Security Alarms (Panic emergency events)
export function subscribeToSecurityEvents(onUpdate: (events: any[]) => void) {
  return onSnapshot(collection(db, 'security_events'), (snapshot) => {
    const events: any[] = [];
    snapshot.forEach((docSnap) => {
      events.push({ id: docSnap.id, ...docSnap.data() });
    });
    // Sort in code by date descending
    events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    onUpdate(events);
  });
}

export async function triggerSecurityEvent(event: {
  id: string;
  reporterName: string;
  reporterPhone: string;
  reporterRole: 'passenger' | 'driver';
  rideId: string;
  latitude: number;
  longitude: number;
  description: string;
}): Promise<void> {
  const eventRef = doc(db, 'security_events', event.id);
  await setDoc(eventRef, {
    ...event,
    status: 'active',
    createdAt: new Date().toISOString()
  });
}

export async function resolveSecurityEvent(eventId: string): Promise<void> {
  const eventRef = doc(db, 'security_events', eventId);
  await updateDoc(eventRef, {
    status: 'resolved',
    resolvedAt: new Date().toISOString()
  });
}

// Disputes module
export function subscribeToDisputes(onUpdate: (disputes: any[]) => void) {
  return onSnapshot(collection(db, 'disputes'), (snapshot) => {
    const disputes: any[] = [];
    snapshot.forEach((docSnap) => {
      disputes.push({ id: docSnap.id, ...docSnap.data() });
    });
    disputes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    onUpdate(disputes);
  });
}

export async function createDispute(dispute: {
  id: string;
  userId: string;
  userName: string;
  rideId: string;
  reason: string;
  amount: number;
}): Promise<void> {
  const disputeRef = doc(db, 'disputes', dispute.id);
  await setDoc(disputeRef, {
    ...dispute,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
}

export async function updateDisputeStatus(disputeId: string, status: 'resolved' | 'rejected', notes: string): Promise<void> {
  const disputeRef = doc(db, 'disputes', disputeId);
  await updateDoc(disputeRef, {
    status,
    resolutionNotes: notes,
    resolvedAt: new Date().toISOString()
  });
}

// Blacklist (Blocked CPFs, phones, etc.)
export function subscribeToBlacklist(onUpdate: (list: any[]) => void) {
  return onSnapshot(collection(db, 'blacklist'), (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    onUpdate(list);
  });
}

export async function addToBlacklist(entry: { value: string; type: 'cpf' | 'phone' | 'email'; reason: string }): Promise<void> {
  const id = `bl_${Date.now()}`;
  const ref = doc(db, 'blacklist', id);
  await setDoc(ref, {
    id,
    value: entry.value,
    type: entry.type,
    reason: entry.reason,
    createdAt: new Date().toISOString()
  });
}

export async function removeFromBlacklist(id: string): Promise<void> {
  const ref = doc(db, 'blacklist', id);
  await deleteDoc(ref);
}

// Full-deletion operations for system entities
export async function deleteUserAccount(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const walletRef = doc(db, 'wallets', userId);
  await deleteDoc(userRef);
  await deleteDoc(walletRef);
}

export async function deleteDriverAccount(driverId: string): Promise<void> {
  const driverRef = doc(db, 'drivers', driverId);
  const walletRef = doc(db, 'wallets', driverId);
  await deleteDoc(driverRef);
  await deleteDoc(walletRef);
}

export async function deleteAdminAccount(uid: string): Promise<void> {
  const adminRef = doc(db, 'admins', uid);
  await deleteDoc(adminRef);
}

// Full profile and status management for system entities
export async function updateAdminProfileAllFields(uid: string, adminData: Partial<Admin>): Promise<void> {
  const adminRef = doc(db, 'admins', uid);
  await updateDoc(adminRef, {
    ...adminData,
    updatedAt: new Date().toISOString()
  });
}

export async function updateDriverProfileAllFields(driverId: string, driverData: Partial<any>): Promise<void> {
  const driverRef = doc(db, 'drivers', driverId);
  await updateDoc(driverRef, {
    ...driverData,
    updatedAt: new Date().toISOString()
  });
}

export async function updateUserProfileAllFields(userId: string, userData: Partial<any>): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...userData,
    updatedAt: new Date().toISOString()
  });
}

// Company Management (Empresas Parceiras)
export function subscribeToCompanies(onUpdate: (companies: Company[]) => void) {
  const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: Company[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Company);
    });
    onUpdate(list);
  });
}

export async function createCompany(company: Omit<Company, 'id' | 'createdAt'>): Promise<string> {
  const id = `comp_${Date.now()}`;
  const companyRef = doc(db, 'companies', id);
  const newCompany: Company = {
    id,
    ...company,
    createdAt: new Date().toISOString()
  };
  await setDoc(companyRef, newCompany);
  return id;
}

export async function updateCompany(companyId: string, companyData: Partial<Company>): Promise<void> {
  const companyRef = doc(db, 'companies', companyId);
  await updateDoc(companyRef, companyData);
}

export async function deleteCompany(companyId: string): Promise<void> {
  const companyRef = doc(db, 'companies', companyId);
  await deleteDoc(companyRef);
}

// Company Plans Management
const defaultPlans: CompanyPlan[] = [
  {
    id: 'basic',
    name: 'Plano Básico',
    monthlyValue: 199.00,
    rideLimit: 50,
    discountPercent: 5,
    customRatePerKm: 2.20,
    employeeLimit: 10
  },
  {
    id: 'corporate',
    name: 'Plano Empresarial',
    monthlyValue: 499.00,
    rideLimit: 200,
    discountPercent: 10,
    customRatePerKm: 1.95,
    employeeLimit: 50
  },
  {
    id: 'premium',
    name: 'Plano Premium',
    monthlyValue: 999.00,
    rideLimit: 1000,
    discountPercent: 15,
    customRatePerKm: 1.70,
    employeeLimit: 200
  }
];

export function subscribeToPlans(onUpdate: (plans: CompanyPlan[]) => void) {
  const colRef = collection(db, 'company_plans');
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      // Seed default plans if collection is empty
      const batch = writeBatch(db);
      defaultPlans.forEach(plan => {
        batch.set(doc(colRef, plan.id), plan);
      });
      await batch.commit();
    } else {
      const list: CompanyPlan[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as CompanyPlan);
      });
      onUpdate(list);
    }
  });
}

export async function savePlan(plan: CompanyPlan): Promise<void> {
  const planRef = doc(db, 'company_plans', plan.id);
  await setDoc(planRef, plan);
}

// ==========================================
// BACKUP & DATA PROTECTION OPERATIONS
// ==========================================

export function subscribeToBackups(onUpdate: (backups: any[]) => void) {
  const q = query(collection(db, 'backups'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    onUpdate(list);
  }, (err) => {
    console.error("Erro no onSnapshot de Backups:", err);
  });
}

export async function createBackupRecord(backup: {
  id: string;
  createdBy: string;
  fileName: string;
  summary: {
    users: number;
    drivers: number;
    companies: number;
    rides: number;
    transactions: number;
    admins: number;
  };
  dataPayload?: string; // Contains serialized JSON for secure recovery
}): Promise<void> {
  const ref = doc(db, 'backups', backup.id);
  await setDoc(ref, {
    ...backup,
    createdAt: new Date().toISOString()
  });
}

export async function deleteBackupRecord(id: string): Promise<void> {
  const ref = doc(db, 'backups', id);
  await deleteDoc(ref);
}

