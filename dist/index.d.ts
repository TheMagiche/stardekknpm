export interface RatePlan {
    ratePlanID: string;
    ratePlanName: string;
}
export interface Room {
    roomID: string;
    roomName: string;
    rates: RatePlan[];
}
export interface Rate {
    amount: string;
    ratePlanCode: string;
}
export interface Availability {
    roomID: string;
    startDate: string;
    endDate: string;
    rates: Rate[];
}
export interface RatePlanData {
    effectiveDate: string;
    ratePlanID: string;
    ratePlanName: string;
    amount: string;
}
export interface GuestCount {
    ageQualifyingCode: string;
    count: string;
}
export interface RoomStay {
    indexNumber: number;
    roomID: string;
    ratePlans: RatePlanData[];
    totalAmount: string;
    hotelCode: string;
    comment: string;
    guestCounts: GuestCount[];
}
export interface PaymentCard {
    cardCode: string;
    cardNumber: string;
    seriesCode: string;
    expireDate: string;
    cardHolderName: string;
}
export interface Customer {
    surname: string;
    phoneNumber: string;
    email: string;
    addressLine: string;
    cityName: string;
    postalCode: string;
    countryName: string;
}
export interface ResGlobalInfo {
    start: string;
    end: string;
    comment: string;
    paymentCard: PaymentCard;
    totalAmount: string;
    customer: Customer;
}
export interface ReservationData {
    createDateTime: string;
    creatorID: string;
    resStatus: string;
    roomStays: RoomStay[];
    resGlobalInfo: ResGlobalInfo;
}
export interface ReservationResponse {
    createDateTime: string;
    creatorID: string;
    resStatus: string;
    roomStays: {
        roomID: string;
        rates: RatePlanData[];
        totalAmount: string;
        comment: string;
    }[];
}
/**
 * Generates authentication XML for Stardekk API
 * @param username - The username for authentication
 * @param password - The password for authentication
 * @returns Authentication XML string
 */
export declare function authenticate(username: string, password: string): string;
/**
 * Retrieves room information from the Stardekk API
 * @param endpoint - API endpoint URL
 * @param authXML - Authentication XML string
 * @returns Promise resolving to an array of room information
 */
export declare function getRoomInformation(endpoint: string, authXML: string): Promise<Room[]>;
/**
 * Retrieves rates and availability information from the Stardekk API
 * @param endpoint - API endpoint URL
 * @param authXML - Authentication XML string
 * @param roomID - Room identifier
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Promise resolving to an array of availability information
 */
export declare function getRatesAndAvailability(endpoint: string, authXML: string, roomID: string, startDate: string, endDate: string): Promise<Availability[]>;
/**
 * Pushes a reservation to the Stardekk API
 * @param endpoint - API endpoint URL
 * @param authXML - Authentication XML string
 * @param reservationData - Reservation data object
 * @returns Promise resolving to the API response
 */
export declare function pushReservation(endpoint: string, authXML: string, reservationData: ReservationData): Promise<string>;
/**
 * Pulls reservation information from the Stardekk API
 * @param endpoint - API endpoint URL
 * @param authXML - Authentication XML string
 * @param purgeDate - Optional purge date
 * @returns Promise resolving to an array of reservation information
 */
export declare function pullReservation(endpoint: string, authXML: string, purgeDate?: string): Promise<ReservationResponse[]>;
