"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.getRoomInformation = getRoomInformation;
exports.getRatesAndAvailability = getRatesAndAvailability;
exports.pushReservation = pushReservation;
exports.pullReservation = pullReservation;
const xmldom_1 = require("xmldom");
/**
 * Generates authentication XML for Stardekk API
 * @param username - The username for authentication
 * @param password - The password for authentication
 * @returns Authentication XML string
 */
function authenticate(username, password) {
    const xml = `
    <POS>
        <Source>
            <RequestorID Type="1" ID="${username}" MessagePassword="${password}" />
        </Source>
        <Source>
            <RequestorID Type="2" ID="2" />
        </Source>
    </POS>`;
    return xml;
}
/**
 * Retrieves room information from the Stardekk API
 * @param endpoint - API endpoint URL
 * @param authXML - Authentication XML string
 * @returns Promise resolving to an array of room information
 */
async function getRoomInformation(endpoint, authXML) {
    const requestXML = `
    <OTA_HotelRoomListRQ Version="2.0" xmlns="http://www.opentravel.org/OTA/2003/05">
        ${authXML}
        <HotelRoomLists>
            <HotelRoomList/>
        </HotelRoomLists>
    </OTA_HotelRoomListRQ>`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/xml'
        },
        body: requestXML
    });
    const responseXML = await response.text();
    const parser = new xmldom_1.DOMParser();
    const xmlDoc = parser.parseFromString(responseXML, "application/xml");
    // Convert XML to JSON
    const roomList = xmlDoc.getElementsByTagName('RoomStay');
    const rooms = [];
    for (let i = 0; i < roomList.length; i++) {
        const room = roomList[i];
        const roomType = room.getElementsByTagName('RoomType')[0];
        const ratePlans = room.getElementsByTagName('RatePlan');
        const rates = [];
        for (let j = 0; j < ratePlans.length; j++) {
            const ratePlan = ratePlans[j];
            rates.push({
                ratePlanID: ratePlan.getAttribute('RatePlanID') || '',
                ratePlanName: ratePlan.getAttribute('RatePlanName') || ''
            });
        }
        rooms.push({
            roomID: roomType.getAttribute('RoomID') || '',
            roomName: roomType.getElementsByTagName('RoomDescription')[0].getAttribute('Name') || '',
            rates: rates
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
async function getRatesAndAvailability(endpoint, authXML, roomID, startDate, endDate) {
    const requestXML = `
    <OTA_HotelAvailNotifRQ Version="2.0" xmlns="http://www.opentravel.org/OTA/2003/05">
        ${authXML}
        <AvailStatusMessages>
            <AvailStatusMessage>
                <StatusApplicationControl InvCode="${roomID}" Start="${startDate}" End="${endDate}" />
            </AvailStatusMessage>
        </AvailStatusMessages>
    </OTA_HotelAvailNotifRQ>`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/xml'
        },
        body: requestXML
    });
    const responseXML = await response.text();
    const parser = new xmldom_1.DOMParser();
    const xmlDoc = parser.parseFromString(responseXML, "application/xml");
    // Convert XML to JSON
    const statusMessages = xmlDoc.getElementsByTagName('AvailStatusMessage');
    const availability = [];
    for (let i = 0; i < statusMessages.length; i++) {
        const message = statusMessages[i];
        const statusControl = message.getElementsByTagName('StatusApplicationControl')[0];
        const rates = message.getElementsByTagName('BestAvailableRate');
        const rateList = [];
        for (let j = 0; j < rates.length; j++) {
            const rate = rates[j];
            rateList.push({
                amount: rate.getAttribute('Amount') || '',
                ratePlanCode: rate.getAttribute('RatePlanCode') || ''
            });
        }
        availability.push({
            roomID: statusControl.getAttribute('InvCode') || '',
            startDate: statusControl.getAttribute('Start') || '',
            endDate: statusControl.getAttribute('End') || '',
            rates: rateList
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
async function pushReservation(endpoint, authXML, reservationData) {
    const { createDateTime, creatorID, resStatus, roomStays, resGlobalInfo } = reservationData;
    const roomStaysXML = roomStays.map(stay => `
        <RoomStay IndexNumber="${stay.indexNumber}">
            <RoomTypes>
                <RoomType IsRoom="true" RoomID="${stay.roomID}" />
            </RoomTypes>
            <RatePlans>
                ${stay.ratePlans.map(plan => `
                    <RatePlan EffectiveDate="${plan.effectiveDate}" RatePlanID="${plan.ratePlanID}" RatePlanName="${plan.ratePlanName}">
                        <AdditionalDetails>
                            <AdditionalDetail Amount="${plan.amount}" />
                        </AdditionalDetails>
                    </RatePlan>
                `).join('')}
            </RatePlans>
            <Total AmountAfterTax="${stay.totalAmount}" />
            <BasicPropertyInfo HotelCode="${stay.hotelCode}" />
            <Comments>
                <Comment>
                    <Text>${stay.comment}</Text>
                </Comment>
            </Comments>
            <GuestCounts>
                ${stay.guestCounts.map(guest => `
                    <GuestCount AgeQualifyingCode="${guest.ageQualifyingCode}" Count="${guest.count}" />
                `).join('')}
            </GuestCounts>
        </RoomStay>
    `).join('');
    const resGlobalInfoXML = `
        <ResGlobalInfo>
            <TimeSpan Start="${resGlobalInfo.start}" End="${resGlobalInfo.end}" />
            <Comments>
                <Comment>
                    <Text>${resGlobalInfo.comment}</Text>
                </Comment>
            </Comments>
            <Guarantee>
                <GuaranteesAccepted>
                    <GuaranteeAccepted>
                        <PaymentCard CardCode="${resGlobalInfo.paymentCard.cardCode}" CardNumber="${resGlobalInfo.paymentCard.cardNumber}" SeriesCode="${resGlobalInfo.paymentCard.seriesCode}" ExpireDate="${resGlobalInfo.paymentCard.expireDate}">
                            <CardHolderName>${resGlobalInfo.paymentCard.cardHolderName}</CardHolderName>
                        </PaymentCard>
                    </GuaranteeAccepted>
                </GuaranteesAccepted>
            </Guarantee>
            <Total AmountAfterTax="${resGlobalInfo.totalAmount}" />
            <Profiles>
                <ProfileInfo>
                    <Profile>
                        <Customer>
                            <PersonName>
                                <SurName>${resGlobalInfo.customer.surname}</SurName>
                            </PersonName>
                            <Telephone PhoneNumber="${resGlobalInfo.customer.phoneNumber}" />
                            <Email>${resGlobalInfo.customer.email}</Email>
                            <Address>
                                <AddressLine>${resGlobalInfo.customer.addressLine}</AddressLine>
                                <CityName>${resGlobalInfo.customer.cityName}</CityName>
                                <PostalCode>${resGlobalInfo.customer.postalCode}</PostalCode>
                                <CountryName>${resGlobalInfo.customer.countryName}</CountryName>
                            </Address>
                        </Customer>
                    </Profile>
                </ProfileInfo>
            </Profiles>
        </ResGlobalInfo>
    `;
    const requestXML = `
    <OTA_HotelResRQ Version="2.0" xmlns="http://www.opentravel.org/OTA/2003/05">
        ${authXML}
        <HotelReservations>
            <HotelReservation CreateDateTime="${createDateTime}" CreatorID="${creatorID}" ResStatus="${resStatus}">
                ${roomStaysXML}
                ${resGlobalInfoXML}
            </HotelReservation>
        </HotelReservations>
    </OTA_HotelResRQ>`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/xml'
        },
        body: requestXML
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
async function pullReservation(endpoint, authXML, purgeDate) {
    var _a;
    const requestXML = `
    <OTA_HotelResRQ Version="2.0" xmlns="http://www.opentravel.org/OTA/2003/05">
        ${authXML}
        <HotelReservations>
            <HotelReservation${purgeDate ? ` PurgeDate="${purgeDate}"` : ''} />
        </HotelReservations>
    </OTA_HotelResRQ>`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/xml'
        },
        body: requestXML
    });
    const responseXML = await response.text();
    const parser = new xmldom_1.DOMParser();
    const xmlDoc = parser.parseFromString(responseXML, "application/xml");
    // Convert XML to JSON
    const reservations = xmlDoc.getElementsByTagName('HotelReservation');
    const reservationList = [];
    for (let i = 0; i < reservations.length; i++) {
        const reservation = reservations[i];
        const roomStays = reservation.getElementsByTagName('RoomStay');
        const stays = [];
        for (let j = 0; j < roomStays.length; j++) {
            const stay = roomStays[j];
            const roomType = stay.getElementsByTagName('RoomType')[0];
            const ratePlans = stay.getElementsByTagName('RatePlan');
            const rates = [];
            for (let k = 0; k < ratePlans.length; k++) {
                const ratePlan = ratePlans[k];
                rates.push({
                    effectiveDate: ratePlan.getAttribute('EffectiveDate') || '',
                    ratePlanID: ratePlan.getAttribute('RatePlanID') || '',
                    ratePlanName: ratePlan.getAttribute('RatePlanName') || '',
                    amount: ratePlan.getElementsByTagName('AdditionalDetail')[0].getAttribute('Amount') || ''
                });
            }
            stays.push({
                roomID: roomType.getAttribute('RoomID') || '',
                rates: rates,
                totalAmount: stay.getElementsByTagName('Total')[0].getAttribute('AmountAfterTax') || '',
                comment: ((_a = stay.getElementsByTagName('Text')[0]) === null || _a === void 0 ? void 0 : _a.textContent) || ''
            });
        }
        reservationList.push({
            createDateTime: reservation.getAttribute('CreateDateTime') || '',
            creatorID: reservation.getAttribute('CreatorID') || '',
            resStatus: reservation.getAttribute('ResStatus') || '',
            roomStays: stays
        });
    }
    return reservationList;
}
