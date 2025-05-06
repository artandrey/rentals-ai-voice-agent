from dataclasses import dataclass
from enum import Enum
from typing import Optional, Dict, Any, List
from uuid import UUID, uuid4

from crm_api_client.crm_manager_client.api.clients import (
    clients_controller_find_client_by_phone,
    clients_controller_get_client_by_id,
    clients_controller_create_client,
    clients_controller_update_client_name,
    clients_controller_update_client_preferences,
    clients_controller_update_client_preferred_language
)
from crm_api_client.crm_manager_client.api.rentals import (
    rentals_controller_get_rentals,
    rentals_controller_get_rental_by_id,
    rentals_controller_get_rental_emergency_details,
    rentals_controller_get_rental_settlement_details
)
from crm_api_client.crm_manager_client.client import Client
from crm_api_client.crm_manager_client.models.client_dto import ClientDto
from crm_api_client.crm_manager_client.models.create_client_dto import CreateClientDto
from crm_api_client.crm_manager_client.models.update_client_name_dto import UpdateClientNameDto
from crm_api_client.crm_manager_client.models.update_client_preferences_dto import UpdateClientPreferencesDto
from crm_api_client.crm_manager_client.models.update_client_preferred_language_dto import UpdateClientPreferredLanguageDto
from crm_api_client.crm_manager_client.models.update_client_preferred_language_dto_language import UpdateClientPreferredLanguageDtoLanguage
from crm_api_client.crm_manager_client.models.compact_rental_dto import CompactRentalDto
from crm_api_client.crm_manager_client.models.rental_emergency_details_dto import RentalEmergencyDetailsDto
from crm_api_client.crm_manager_client.models.rental_settlement_details_dto import RentalSettlementDetailsDto


class Language(str, Enum):
    """Supported languages for call sessions."""
    UK = "UK"
    EN = "EN"


@dataclass
class CallSession:
    """
    Represents a call session with a client.
    
    Attributes:
        id: Unique identifier for the call session
        phone_number: The phone number of the caller
        client_id: Optional client identifier if the caller is a known client
        language: The language preference for the call (UK or EN)
    """
    id: UUID
    phone_number: str
    client_id: Optional[str] = None
    language: Language = Language.EN
    
    @classmethod
    def create(cls, phone_number: str, client_id: Optional[str] = None, language: Language = Language.EN) -> 'CallSession':
        """
        Factory method to create a new call session with a generated UUID.
        
        Args:
            phone_number: The phone number of the caller
            client_id: Optional client identifier
            language: The preferred language for the call
            
        Returns:
            A new CallSession instance
        """
        return cls(
            id=uuid4(),
            phone_number=phone_number,
            client_id=client_id,
            language=language
        )
    
    def is_identified(self) -> bool:
        """
        Checks if the call session has an identified client.
        
        Returns:
            True if client_id is present, False otherwise
        """
        return self.client_id is not None
    
    async def find_client_by_phone(self, crm_client: Client) -> Optional[ClientDto]:
        """
        Retrieve client information by phone number.
        
        Args:
            crm_client: CRM API client instance
            
        Returns:
            ClientDto object if found, None otherwise
        """
        try:
            response = await clients_controller_find_client_by_phone.asyncio(
                client=crm_client, 
                phone_number=self.phone_number
            )
            if hasattr(response, 'parsed'):
                # Update client_id if client found
                client_dto = response.parsed
                self.client_id = str(client_dto.id)
                return client_dto
            return None
        except Exception as e:
            # Handle errors (log or raise as appropriate for your application)
            print(f"Error finding client by phone: {e}")
            return None
    
    async def get_client(self, crm_client: Client) -> Optional[ClientDto]:
        """
        Retrieve client information by client ID.
        
        Args:
            crm_client: CRM API client instance
            
        Returns:
            ClientDto object if found, None otherwise
        """
        if not self.client_id:
            return None
            
        try:
            response = await clients_controller_get_client_by_id.asyncio(
                client=crm_client, 
                id=self.client_id
            )
            if hasattr(response, 'parsed'):
                return response.parsed
            return None
        except Exception as e:
            print(f"Error getting client by ID: {e}")
            return None
    
    async def create_client(self, crm_client: Client, client_data: Dict[str, Any]) -> Optional[ClientDto]:
        """
        Create a new client in the CRM system.
        
        Args:
            crm_client: CRM API client instance
            client_data: Dictionary containing client information
            
        Returns:
            Created ClientDto object if successful, None otherwise
        """
        try:
            create_dto = CreateClientDto(
                full_name=client_data.get('full_name', ''),
                phone_number=self.phone_number,
                email=client_data.get('email'),
                notes=client_data.get('notes'),
                preferred_language=UpdateClientPreferredLanguageDtoLanguage(client_data.get('preferred_language', self.language.value))
            )
            
            response = await clients_controller_create_client.asyncio(
                client=crm_client,
                json_body=create_dto
            )
            
            if hasattr(response, 'parsed'):
                client_dto = response.parsed
                self.client_id = str(client_dto.id)
                return client_dto
            return None
        except Exception as e:
            print(f"Error creating client: {e}")
            return None
    
    async def update_client_name(self, crm_client: Client, full_name: str) -> Optional[ClientDto]:
        """
        Update client's full name.
        
        Args:
            crm_client: CRM API client instance
            full_name: New full name for the client
            
        Returns:
            Updated ClientDto object if successful, None otherwise
        """
        if not self.client_id:
            return None
            
        try:
            update_dto = UpdateClientNameDto(full_name=full_name)
            
            response = await clients_controller_update_client_name.asyncio(
                client=crm_client,
                id=self.client_id,
                json_body=update_dto
            )
            
            if hasattr(response, 'parsed'):
                return response.parsed
            return None
        except Exception as e:
            print(f"Error updating client name: {e}")
            return None
    
    async def update_client_preferences(self, crm_client: Client, preferences: str) -> Optional[ClientDto]:
        """
        Update client's preferences.
        
        Args:
            crm_client: CRM API client instance
            preferences: New preferences for the client
            
        Returns:
            Updated ClientDto object if successful, None otherwise
        """
        if not self.client_id:
            return None
            
        try:
            update_dto = UpdateClientPreferencesDto(preferences=preferences)
            
            response = await clients_controller_update_client_preferences.asyncio(
                client=crm_client,
                id=self.client_id,
                json_body=update_dto
            )
            
            if hasattr(response, 'parsed'):
                return response.parsed
            return None
        except Exception as e:
            print(f"Error updating client preferences: {e}")
            return None
    
    async def update_client_language(self, crm_client: Client, language: Language) -> Optional[ClientDto]:
        """
        Update client's preferred language.
        
        Args:
            crm_client: CRM API client instance
            language: New language preference for the client
            
        Returns:
            Updated ClientDto object if successful, None otherwise
        """
        if not self.client_id:
            return None
            
        try:
            # Update session language
            self.language = language
            
            # Update in CRM
            update_dto = UpdateClientPreferredLanguageDto(
                language=UpdateClientPreferredLanguageDtoLanguage(language.value)
            )
            
            response = await clients_controller_update_client_preferred_language.asyncio(
                client=crm_client,
                id=self.client_id,
                json_body=update_dto
            )
            
            if hasattr(response, 'parsed'):
                return response.parsed
            return None
        except Exception as e:
            print(f"Error updating client language: {e}")
            return None
            
    async def get_available_rentals(self, crm_client: Client) -> Optional[List[CompactRentalDto]]:
        """
        Retrieve all available rentals.
        
        Args:
            crm_client: CRM API client instance
            
        Returns:
            List of CompactRentalDto objects if successful, None otherwise
        """
        try:
            response = await rentals_controller_get_rentals.asyncio(
                client=crm_client
            )
            
            if hasattr(response, 'parsed'):
                return response.parsed
            return None
        except Exception as e:
            print(f"Error getting available rentals: {e}")
            return None
    
    async def get_rental_details(self, crm_client: Client, rental_id: str) -> Optional[CompactRentalDto]:
        """
        Retrieve detailed information about a specific rental.
        
        Args:
            crm_client: CRM API client instance
            rental_id: ID of the rental to retrieve
            
        Returns:
            CompactRentalDto object if successful, None otherwise
        """
        try:
            response = await rentals_controller_get_rental_by_id.asyncio(
                client=crm_client,
                id=rental_id
            )
            
            if hasattr(response, 'parsed'):
                return response.parsed
            return None
        except Exception as e:
            print(f"Error getting rental details: {e}")
            return None
    
    async def get_rental_emergency_details(self, crm_client: Client, rental_id: str) -> Optional[RentalEmergencyDetailsDto]:
        """
        Retrieve emergency details about a specific rental.
        
        Args:
            crm_client: CRM API client instance
            rental_id: ID of the rental to retrieve emergency details for
            
        Returns:
            RentalEmergencyDetailsDto object if successful, None otherwise
        """
        try:
            response = await rentals_controller_get_rental_emergency_details.asyncio(
                client=crm_client,
                id=rental_id
            )
            
            if hasattr(response, 'parsed'):
                return response.parsed
            return None
        except Exception as e:
            print(f"Error getting rental emergency details: {e}")
            return None
    
    async def get_rental_settlement_details(self, crm_client: Client, rental_id: str) -> Optional[RentalSettlementDetailsDto]:
        """
        Retrieve settlement details about a specific rental.
        
        Args:
            crm_client: CRM API client instance
            rental_id: ID of the rental to retrieve settlement details for
            
        Returns:
            RentalSettlementDetailsDto object if successful, None otherwise
        """
        try:
            response = await rentals_controller_get_rental_settlement_details.asyncio(
                client=crm_client,
                id=rental_id
            )
            
            if hasattr(response, 'parsed'):
                return response.parsed
            return None
        except Exception as e:
            print(f"Error getting rental settlement details: {e}")
            return None
            
    async def book_rental(self, crm_client: Client, rental_id: str) -> Dict[str, Any]:
        """
        Book a rental for the client.
        
        Note: This is a placeholder method since the actual booking API endpoint
        is not available in the provided API client. In a real implementation,
        you would call the appropriate endpoint to create a booking.
        
        Args:
            crm_client: CRM API client instance
            rental_id: ID of the rental to book
            
        Returns:
            A dictionary with booking status information
        """
        if not self.client_id:
            return {
                "success": False,
                "message": "Client must be identified before booking"
            }
            
        # Get rental details to verify it exists
        rental = await self.get_rental_details(crm_client, rental_id)
        if not rental:
            return {
                "success": False,
                "message": f"Rental with ID {rental_id} not found"
            }
            
        # In a real implementation, you would call the booking creation endpoint here
        # Since we don't have that endpoint, we'll return a simulated success response
        return {
            "success": True,
            "message": "Booking request processed",
            "booking_id": str(uuid4()),  # Generate a fake booking ID
            "rental_id": rental_id,
            "client_id": self.client_id,
            "status": "pending_confirmation"
        } 