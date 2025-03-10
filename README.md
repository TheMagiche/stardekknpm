# Stardekk API Client

A TypeScript package for interacting with the Stardekk Channel Manager API.

## Installation

```bash
npm install stardekknpm
```

## Usage

```typescript
import { 
  authenticate, 
  getRoomInformation, 
  getRatesAndAvailability, 
  pushReservation, 
  pullReservation 
} from 'stardekknpm';

// Generate authentication XML
const authXML = authenticate('username', 'password');

// Get room information
const rooms = await getRoomInformation('https://cubilis.eu/plugins/ota/roomlist.aspx', authXML);

// Get rates and availability
const availability = await getRatesAndAvailability(
  'https://cubilis.eu/plugins/ota/availnotif.aspx', 
  authXML, 
  'RoomID1', 
  '2024-07-01', 
  '2024-07-10'
);

// Push a reservation
const reservationData = {
  // ... reservation data
};
const response = await pushReservation(
  'https://cubilis.eu/plugins/ota/reservations.aspx', 
  authXML, 
  reservationData
);

// Pull reservations
const reservations = await pullReservation(
  'https://cubilis.eu/plugins/ota/reservations.aspx', 
  authXML, 
  '2024-07-01'
);
```

## API

### authenticate(username: string, password: string): string

Generates authentication XML for Stardekk API.

### getRoomInformation(endpoint: string, authXML: string): Promise<Room[]>

Retrieves room information from the Stardekk API.

### getRatesAndAvailability(endpoint: string, authXML: string, roomID: string, startDate: string, endDate: string): Promise<Availability[]>

Retrieves rates and availability information from the Stardekk API.

### pushReservation(endpoint: string, authXML: string, reservationData: ReservationData): Promise<string>

Pushes a reservation to the Stardekk API.

### pullReservation(endpoint: string, authXML: string, purgeDate?: string): Promise<ReservationResponse[]>

Pulls reservation information from the Stardekk API.

## License

MIT