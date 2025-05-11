from crm_api_client.crm_manager_client.models.client_accommodation_dto import ClientAccommodationDto
from crm_api_client.crm_manager_client.api.clients import clients_controller_create_client
from crm_api_client.crm_manager_client.models.client_dto import ClientDto
from crm_api_client.crm_manager_client.client import Client
from crm_api_client.crm_manager_client.api.clients import clients_controller_get_current_accommodation
from crm_api_client.crm_manager_client.models.date_day_dto import DateDayDto
from datetime import datetime, date, time

class ConversationContext:
    phone_number: str
    accommodation: ClientAccommodationDto | None
    def __init__(self, phone_number: str):
        self.phone_number = phone_number
        self.client: ClientDto | None = None

    def set_client(self, client: ClientDto | None):
        self.client = client

    def get_client(self) -> ClientDto | None:
        return self.client

    def get_phone_number(self) -> str:
        return self.phone_number

    def get_client_accommodation(self) -> ClientAccommodationDto | None:
        return self.client_accommodation

    def set_client_accommodation(self, client_accommodation: ClientAccommodationDto | None):
        self.client_accommodation = client_accommodation

    def check_is_allowed_to_settle(self) -> dict:
        """
        Checks if the client is allowed to settle into their current accommodation.
        Returns a dictionary with "success": bool and "message": str.
        """
        accommodation = self.get_client_accommodation()
        return {"success": True, "message": "You are eligible to proceed with settlement."}

        if not accommodation:
            return {"success": False, "message": "You do not have a current accommodation record. Please book an accommodation first."}

        if not hasattr(accommodation, 'start_date') or not accommodation.start_date:
            return {"success": False, "message": "Booking start date is missing for your current accommodation."}
        
        # Assuming accommodation.start_date is like DateDayDto with year, month, day
        try:
            booking_start_date_obj = accommodation.start_date
            booking_date = date(booking_start_date_obj.year, booking_start_date_obj.month, booking_start_date_obj.day)
        except AttributeError:
             return {"success": False, "message": "Could not read booking start date from your accommodation details."}


        if not hasattr(accommodation, 'status') or not accommodation.status:
            return {"success": False, "message": "Booking status is missing for your current accommodation."}
        booking_status = accommodation.status

        current_dt = datetime.now()
        current_date = current_dt.date()
        current_time = current_dt.time()

        # 1. Current date should match the date of booking start
        if current_date != booking_date:
            return {
                "success": False,
                "message": f"Settlement is not allowed today. Today is {current_date.strftime('%d.%m.%Y')}, but your booking is for {booking_date.strftime('%d.%m.%Y')}."
            }

        # 2. Time should be AT OR AFTER 13:00 (based on example "settlement is allowed only after 13:00")
        if current_time.hour < 13: # Before 1 PM
            return {
                "success": False,
                "message": f"Settlement is not allowed at this time. Current time is {current_time.strftime('%H:%M')}, and settlement is permitted only after 13:00."
            }

  
        if booking_status.upper() != "BOOKING_CONFIRMED":
            return {
                "success": False,
                "message": f"Settlement is not allowed because your booking status is '{booking_status}'. It needs to be confirmed. It might be pending confirmation by the team."
            }

        return {"success": True, "message": "You are eligible to proceed with settlement."}
