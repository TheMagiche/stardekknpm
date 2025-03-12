import { 
  authenticate, 
  getRoomInformation, 
  getRatesAndAvailability, 
  pushReservation, 
  pullReservation,
  ReservationData
} from './src/index';

// Example usage
async function runExample() {
  const authXML = authenticate('thaiwanconcepts10080', 'RV9N43MKCL', '10080');
  console.log(authXML);
  // Get Room Information
  // https://app.socialerco.com/version-test/api/1.1/obj
  try {
    const rooms = await getRoomInformation('https://cubilis.eu/plugins/ota/roomlist.aspx', authXML);
    console.log('Rooms:', rooms);
  } catch (error) {
    console.error('Error getting room information:', error);
  }

  // // Get Rates and Availability
  // try {
  //   const availability = await getRatesAndAvailability(
  //     'https://cubilis.eu/plugins/ota/availnotif.aspx', 
  //     authXML, 
  //     'RoomID1', 
  //     '2024-07-01', 
  //     '2024-07-10'
  //   );
  //   console.log('Availability:', availability);
  // } catch (error) {
  //   console.error('Error getting rates and availability:', error);
  // }

  // // Push Reservation
  // const reservationData: ReservationData = {
  //   createDateTime: '2024-07-01T12:00:00',
  //   creatorID: '123',
  //   resStatus: 'New',
  //   roomStays: [{
  //     indexNumber: 1,
  //     roomID: 'RoomID1',
  //     hotelCode: 'HOTEL1',
  //     ratePlans: [{
  //       effectiveDate: '2024-07-01',
  //       ratePlanID: 'RatePlanID1',
  //       ratePlanName: 'Default Rate',
  //       amount: '120.45'
  //     }],
  //     totalAmount: '120.45',
  //     comment: 'Customer comment',
  //     guestCounts: [{
  //       ageQualifyingCode: '1',
  //       count: '2'
  //     }]
  //   }],
  //   resGlobalInfo: {
  //     start: '2024-07-01T15:00',
  //     end: '2024-07-03',
  //     comment: 'Global comment',
  //     paymentCard: {
  //       cardCode: 'MC',
  //       cardNumber: '4111111111111111',
  //       seriesCode: '123',
  //       expireDate: '0125',
  //       cardHolderName: 'John Doe'
  //     },
  //     totalAmount: '242.90',
  //     customer: {
  //       surname: 'Doe',
  //       phoneNumber: '123456789',
  //       email: 'john.doe@example.com',
  //       addressLine: '123 Main St',
  //       cityName: 'New York',
  //       postalCode: '10001',
  //       countryName: 'USA'
  //     }
  //   }
  // };

  // try {
  //   const response = await pushReservation(
  //     'https://cubilis.eu/plugins/ota/reservations.aspx', 
  //     authXML, 
  //     reservationData
  //   );
  //   console.log('Reservation Response:', response);
  // } catch (error) {
  //   console.error('Error pushing reservation:', error);
  // }

  // // Pull Reservation
  // try {
  //   const reservations = await pullReservation(
  //     'https://cubilis.eu/plugins/ota/reservations.aspx', 
  //     authXML, 
  //     '2024-07-01'
  //   );
  //   console.log('Reservations:', reservations);
  // } catch (error) {
  //   console.error('Error pulling reservations:', error);
  // }
}

runExample(); 