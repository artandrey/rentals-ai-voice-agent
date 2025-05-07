from crm_api_client.crm_manager_client.api.clients import clients_controller_create_client
from crm_api_client.crm_manager_client.models.client_dto import ClientDto


class ConversationContext:
    phone_number: str
    def __init__(self, phone_number: str):
        self.phone_number = phone_number
        self.client: ClientDto | None = None

    def set_client(self, client: ClientDto | None):
        self.client = client

    def get_client(self) -> ClientDto | None:
        return self.client

    def get_phone_number(self) -> str:
        return self.phone_number
