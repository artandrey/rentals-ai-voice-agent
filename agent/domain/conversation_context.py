from crm_api_client.crm_manager_client.models.client_accommodation_dto import ClientAccommodationDto
from crm_api_client.crm_manager_client.api.clients import clients_controller_create_client
from crm_api_client.crm_manager_client.models.client_dto import ClientDto
from crm_api_client.crm_manager_client.client import Client
from crm_api_client.crm_manager_client.api.clients import clients_controller_get_current_accommodation

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
