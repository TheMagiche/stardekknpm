import { DOMParser } from "xmldom";
import { create } from "xmlbuilder2";

// Type definitions
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
export function authenticate(
  username: string,
  password: string,
  url: string
): string {
  const posObj = {
    POS: {
      Source: [
        {
          RequestorID: {
            "@Type": "1",
            "@ID": username,
            "@MessagePassword": password,
            "#text": " ",
          },
        },
        {
          RequestorID: {
            "@Type": "2",
            "@ID": url,
          },
        },
      ],
    },
  };

  return create(posObj).end({ headless: true });
}

/**
 * Retrieves room information from the Stardekk API
 * @param endpoint - API endpoint URL
 * @param authXML - Authentication XML string
 * @returns Promise resolving to an array of room information
 */
export async function getRoomInformation(
  endpoint: string,
  authXML: string
): Promise<Room[]> {
  const requestObj = {
    OTA_HotelRoomListRQ: {
      "@Version": "2.0",
      "@xmlns": "http://www.opentravel.org/OTA/2003/05",
      "#": [
        { $: authXML },
        {
          HotelRoomLists: {
            HotelRoomList: {},
          },
        },
      ],
    },
  };

  const requestXML = create(requestObj).end({ headless: true });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
    },
    body: requestXML,
  });

  const responseXML = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(responseXML, "application/xml");

  // Convert XML to JSON
  const roomList = xmlDoc.getElementsByTagName("RoomStay");
  const rooms: Room[] = [];
  for (let i = 0; i < roomList.length; i++) {
    const room = roomList[i];
    const roomType = room.getElementsByTagName("RoomType")[0];
    const ratePlans = room.getElementsByTagName("RatePlan");
    const rates: RatePlan[] = [];
    for (let j = 0; j < ratePlans.length; j++) {
      const ratePlan = ratePlans[j];
      rates.push({
        ratePlanID: ratePlan.getAttribute("RatePlanID") || "",
        ratePlanName: ratePlan.getAttribute("RatePlanName") || "",
      });
    }
    rooms.push({
      roomID: roomType.getAttribute("RoomID") || "",
      roomName:
        roomType
          .getElementsByTagName("RoomDescription")[0]
          .getAttribute("Name") || "",
      rates: rates,
    });
  }
  return rooms;
}

/**
 * Retrieves rates and availability information from the Stardekk API
 * @param endpoint - API endpoint URL
 * @param authXML - Authentication XML string
 * @param roomID - Room identifier
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Promise resolving to an array of availability information
 */
export async function getRatesAndAvailability(
  endpoint: string,
  authXML: string,
  roomID: string,
  startDate: string,
  endDate: string
): Promise<Availability[]> {
  const requestObj = {
    OTA_HotelAvailNotifRQ: {
      "@Version": "2.0",
      "@xmlns": "http://www.opentravel.org/OTA/2003/05",
      "#": [
        { $: authXML },
        {
          AvailStatusMessages: {
            AvailStatusMessage: {
              StatusApplicationControl: {
                "@InvCode": roomID,
                "@Start": startDate,
                "@End": endDate,
              },
            },
          },
        },
      ],
    },
  };

  const requestXML = create(requestObj).end({ headless: true });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
    },
    body: requestXML,
  });

  const responseXML = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(responseXML, "application/xml");

  // Convert XML to JSON
  const statusMessages = xmlDoc.getElementsByTagName("AvailStatusMessage");
  const availability: Availability[] = [];
  for (let i = 0; i < statusMessages.length; i++) {
    const message = statusMessages[i];
    const statusControl = message.getElementsByTagName(
      "StatusApplicationControl"
    )[0];
    const rates = message.getElementsByTagName("BestAvailableRate");
    const rateList: Rate[] = [];
    for (let j = 0; j < rates.length; j++) {
      const rate = rates[j];
      rateList.push({
        amount: rate.getAttribute("Amount") || "",
        ratePlanCode: rate.getAttribute("RatePlanCode") || "",
      });
    }
    availability.push({
      roomID: statusControl.getAttribute("InvCode") || "",
      startDate: statusControl.getAttribute("Start") || "",
      endDate: statusControl.getAttribute("End") || "",
      rates: rateList,
    });
  }
  return availability;
}

/**
 * Pushes a reservation to the Stardekk API
 * @param endpoint - API endpoint URL
 * @param authXML - Authentication XML string
 * @param reservationData - Reservation data object
 * @returns Promise resolving to the API response
 */
export async function pushReservation(
  endpoint: string,
  authXML: string,
  reservationData: ReservationData
): Promise<string> {
  const { createDateTime, creatorID, resStatus, roomStays, resGlobalInfo } =
    reservationData;

  // Build room stays
  const roomStaysObj = roomStays.map((stay) => {
    const ratePlansObj = stay.ratePlans.map((plan) => ({
      "@EffectiveDate": plan.effectiveDate,
      "@RatePlanID": plan.ratePlanID,
      "@RatePlanName": plan.ratePlanName,
      AdditionalDetails: {
        AdditionalDetail: {
          "@Amount": plan.amount,
        },
      },
    }));

    const guestCountsObj = stay.guestCounts.map((guest) => ({
      "@AgeQualifyingCode": guest.ageQualifyingCode,
      "@Count": guest.count,
    }));

    return {
      "@IndexNumber": stay.indexNumber,
      RoomTypes: {
        RoomType: {
          "@IsRoom": "true",
          "@RoomID": stay.roomID,
        },
      },
      RatePlans: {
        RatePlan: ratePlansObj.length === 1 ? ratePlansObj[0] : ratePlansObj,
      },
      Total: {
        "@AmountAfterTax": stay.totalAmount,
      },
      BasicPropertyInfo: {
        "@HotelCode": stay.hotelCode,
      },
      Comments: {
        Comment: {
          Text: stay.comment,
        },
      },
      GuestCounts: {
        GuestCount:
          guestCountsObj.length === 1 ? guestCountsObj[0] : guestCountsObj,
      },
    };
  });

  // Build reservation request
  const requestObj = {
    OTA_HotelResRQ: {
      "@Version": "2.0",
      "@xmlns": "http://www.opentravel.org/OTA/2003/05",
      "#": [
        { $: authXML },
        {
          HotelReservations: {
            HotelReservation: {
              "@CreateDateTime": createDateTime,
              "@CreatorID": creatorID,
              "@ResStatus": resStatus,
              RoomStay:
                roomStaysObj.length === 1 ? roomStaysObj[0] : roomStaysObj,
              ResGlobalInfo: {
                TimeSpan: {
                  "@Start": resGlobalInfo.start,
                  "@End": resGlobalInfo.end,
                },
                Comments: {
                  Comment: {
                    Text: resGlobalInfo.comment,
                  },
                },
                Guarantee: {
                  GuaranteesAccepted: {
                    GuaranteeAccepted: {
                      PaymentCard: {
                        "@CardCode": resGlobalInfo.paymentCard.cardCode,
                        "@CardNumber": resGlobalInfo.paymentCard.cardNumber,
                        "@SeriesCode": resGlobalInfo.paymentCard.seriesCode,
                        "@ExpireDate": resGlobalInfo.paymentCard.expireDate,
                        CardHolderName:
                          resGlobalInfo.paymentCard.cardHolderName,
                      },
                    },
                  },
                },
                Total: {
                  "@AmountAfterTax": resGlobalInfo.totalAmount,
                },
                Profiles: {
                  ProfileInfo: {
                    Profile: {
                      Customer: {
                        PersonName: {
                          SurName: resGlobalInfo.customer.surname,
                        },
                        Telephone: {
                          "@PhoneNumber": resGlobalInfo.customer.phoneNumber,
                        },
                        Email: resGlobalInfo.customer.email,
                        Address: {
                          AddressLine: resGlobalInfo.customer.addressLine,
                          CityName: resGlobalInfo.customer.cityName,
                          PostalCode: resGlobalInfo.customer.postalCode,
                          CountryName: resGlobalInfo.customer.countryName,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
  };

  const requestXML = create(requestObj).end({ headless: true });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
    },
    body: requestXML,
  });

  const responseXML = await response.text();
  return responseXML;
}

/**
 * Pulls reservation information from the Stardekk API
 * @param endpoint - API endpoint URL
 * @param authXML - Authentication XML string
 * @param purgeDate - Optional purge date
 * @returns Promise resolving to an array of reservation information
 */
export async function pullReservation(
  endpoint: string,
  authXML: string,
  purgeDate?: string
): Promise<ReservationResponse[]> {
  const hotelReservationAttr = purgeDate ? { "@PurgeDate": purgeDate } : {};

  const requestObj = {
    OTA_HotelResRQ: {
      "@Version": "2.0",
      "@xmlns": "http://www.opentravel.org/OTA/2003/05",
      "#": [
        { $: authXML },
        {
          HotelReservations: {
            HotelReservation: hotelReservationAttr,
          },
        },
      ],
    },
  };

  const requestXML = create(requestObj).end({ headless: true });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
    },
    body: requestXML,
  });

  const responseXML = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(responseXML, "application/xml");

  // Convert XML to JSON
  const reservations = xmlDoc.getElementsByTagName("HotelReservation");
  const reservationList: ReservationResponse[] = [];
  for (let i = 0; i < reservations.length; i++) {
    const reservation = reservations[i];
    const roomStays = reservation.getElementsByTagName("RoomStay");
    const stays: {
      roomID: string;
      rates: RatePlanData[];
      totalAmount: string;
      comment: string;
    }[] = [];

    for (let j = 0; j < roomStays.length; j++) {
      const stay = roomStays[j];
      const roomType = stay.getElementsByTagName("RoomType")[0];
      const ratePlans = stay.getElementsByTagName("RatePlan");
      const rates: RatePlanData[] = [];

      for (let k = 0; k < ratePlans.length; k++) {
        const ratePlan = ratePlans[k];
        rates.push({
          effectiveDate: ratePlan.getAttribute("EffectiveDate") || "",
          ratePlanID: ratePlan.getAttribute("RatePlanID") || "",
          ratePlanName: ratePlan.getAttribute("RatePlanName") || "",
          amount:
            ratePlan
              .getElementsByTagName("AdditionalDetail")[0]
              .getAttribute("Amount") || "",
        });
      }

      stays.push({
        roomID: roomType.getAttribute("RoomID") || "",
        rates: rates,
        totalAmount:
          stay
            .getElementsByTagName("Total")[0]
            .getAttribute("AmountAfterTax") || "",
        comment: stay.getElementsByTagName("Text")[0]?.textContent || "",
      });
    }

    reservationList.push({
      createDateTime: reservation.getAttribute("CreateDateTime") || "",
      creatorID: reservation.getAttribute("CreatorID") || "",
      resStatus: reservation.getAttribute("ResStatus") || "",
      roomStays: stays,
    });
  }
  return reservationList;
}
