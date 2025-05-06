import os

from crm_api_client.crm_manager_client.api.clients import clients_controller_find_client_by_phone, clients_controller_get_client_by_id
from crm_api_client.crm_manager_client.client import Client
from dotenv import load_dotenv

load_dotenv()

CRM_MANAGER_URL = os.environ.get("CRM_MANAGER_URL")

if not CRM_MANAGER_URL:
    raise ValueError("CRM_MANAGER_URL environment variable is not set.")

with Client(base_url=CRM_MANAGER_URL) as client:
    result2 = clients_controller_find_client_by_phone.sync(client=client, phone_number="+380111111111")
    print(f"Ping result: {result2}") 