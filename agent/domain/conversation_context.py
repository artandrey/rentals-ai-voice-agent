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

    def is_currently_staying(self) -> dict:
        """
        Checks if the client is currently settled in their accommodation and their stay is ongoing.
        Returns a dictionary with "success": bool and "message": str.
        """
        accommodation = self.get_client_accommodation()

        if not accommodation:
            return {"success": False, "message": "You do not have an active accommodation record to access information or emergency services for."}

        if not hasattr(accommodation, 'status') or not accommodation.status:
            return {"success": False, "message": "Your accommodation status is missing. Cannot verify if you are currently staying."}

        # Assuming status 'SETTLED' means the client is checked in.
        # Adjust "SETTLED".upper() if the status comparison needs to be case-insensitive or match an enum.
        if accommodation.status.upper() != "SETTLED":
            return {"success": False, "message": f"Your accommodation status is '{accommodation.status}'. This service is for guests who are currently settled."}

        if not hasattr(accommodation, 'end_date') or not accommodation.end_date:
            return {"success": False, "message": "Your accommodation end date is missing. Cannot verify if your stay is ongoing."}

        try:
            end_date_details = accommodation.end_date # This is a DateDayDto
            if not all(hasattr(end_date_details, attr) for attr in ['year', 'month', 'day']):
                raise AttributeError("Accommodation end date is incomplete.")
            
            # Standard checkout time is 12:00 PM (noon) on the end date.
            checkout_datetime = datetime(end_date_details.year, end_date_details.month, end_date_details.day, 12, 0, 0)
        except AttributeError as e:
            return {"success": False, "message": f"Could not properly read your accommodation end date: {e}"}
        except ValueError as e: # Handles issues like invalid date components for datetime constructor
            return {"success": False, "message": f"Your accommodation end date appears to be invalid: {e}"}

        current_datetime = datetime.now()

        if current_datetime >= checkout_datetime:
            return {
                "success": False,
                "message": f"Your stay was scheduled to end on {checkout_datetime.strftime('%d.%m.%Y at %H:%M')}. This service is for guests with an active stay."
            }

        if not hasattr(accommodation, 'rental_id') or not accommodation.rental_id:
            # This is important as the info/emergency flow needs rental_id to fetch details.
            return {"success": False, "message": "Your accommodation details are incomplete (missing rental ID), cannot retrieve specific information."}

        return {"success": True, "message": "You are currently staying and settled."}
