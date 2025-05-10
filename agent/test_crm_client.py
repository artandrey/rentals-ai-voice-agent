import os

from crm_api_client.crm_manager_client.models.book_rental_dto import BookRentalDto
from crm_api_client.crm_manager_client.api.accommodations import accommodations_controller_create_booking
from crm_api_client.crm_manager_client.api.rentals import rentals_controller_get_rental_available_date_spans
from crm_api_client.crm_manager_client.api.clients import clients_controller_get_current_accommodation
from crm_api_client.crm_manager_client.api.rentals import rentals_controller_get_rentals
from crm_api_client.crm_manager_client.api.clients import clients_controller_find_client_by_phone, clients_controller_get_client_by_id
from crm_api_client.crm_manager_client.client import Client
from dotenv import load_dotenv
from crm_api_client.crm_manager_client.models.date_day_dto import DateDayDto

load_dotenv()

CRM_MANAGER_URL = os.environ.get("CRM_MANAGER_URL")

if not CRM_MANAGER_URL:
    raise ValueError("CRM_MANAGER_URL environment variable is not set.")

with Client(base_url=CRM_MANAGER_URL) as client:
    result2 = clients_controller_find_client_by_phone.sync(client=client, phone_number="+380991111112")
    print(f"Ping result: {result2}") 
    rentals_list =  rentals_controller_get_rentals.sync(
        client=client,
    )
    rental_available_date_spans = rentals_controller_get_rental_available_date_spans.sync_detailed(
        client=client,
        id=rentals_list[0].id,
        start_date="2025-05-10",
        end_date="2025-05-15"
    )

    response = accommodations_controller_create_booking.sync_detailed(
        client=client,
        body=BookRentalDto(
            rental_id=rentals_list[0].id,
            client_id=result2.id,
            start_date=DateDayDto(
                year=2025,
                month=5,
                day=10
            ),
            end_date=DateDayDto(
                year=2025,
                month=5,
                day=15
            )
        )
    )
    print(f"Response: {response}")
    print(f"Rentals list: {rentals_list}")
    print(f"Rental available date spans: {rental_available_date_spans}")
 