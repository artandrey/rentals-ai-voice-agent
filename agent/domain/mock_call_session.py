from dataclasses import dataclass
from enum import Enum
from typing import Optional, Dict, Any, List
from uuid import UUID, uuid4

from crm_api_client.crm_manager_client.models.client_dto import ClientDto
from crm_api_client.crm_manager_client.models.compact_rental_dto import CompactRentalDto
from crm_api_client.crm_manager_client.models.rental_emergency_details_dto import RentalEmergencyDetailsDto
from crm_api_client.crm_manager_client.models.rental_settlement_details_dto import RentalSettlementDetailsDto
from crm_api_client.crm_manager_client.models.update_client_preferred_language_dto_language import UpdateClientPreferredLanguageDtoLanguage


class Language(str, Enum):
    """Supported languages for call sessions."""
    UK = "UK"
    EN = "EN"


@dataclass
class MockCallSession:
    """
    Represents a mock call session with a client that uses hardcoded data instead of API calls.
    
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
    
    # Mock data storage
    _mock_clients = {
        "1": ClientDto(
            id="1",
            full_name="John Doe",
            phone_number="+380123456789",
            email="john.doe@example.com",
            notes="VIP client",
            preferred_language=UpdateClientPreferredLanguageDtoLanguage.EN
        ),
        "2": ClientDto(
            id="2",
            full_name="Jane Smith",
            phone_number="+380987654321",
            email="jane.smith@example.com",
            notes="Regular client",
            preferred_language=UpdateClientPreferredLanguageDtoLanguage.UK
        )
    }
    
    _mock_rentals = {
        "101": CompactRentalDto(
            id="101",
            name="Luxury Villa",
            address="123 Beach Road",
            status="available",
            price_per_night=200.0
        ),
        "102": CompactRentalDto(
            id="102",
            name="City Apartment",
            address="456 Main Street",
            status="available",
            price_per_night=100.0
        )
    }
    
    _mock_emergency_details = {
        "101": RentalEmergencyDetailsDto(
            id="101",
            emergency_contact_name="Emergency Service",
            emergency_contact_phone="+380111222333",
            emergency_instructions="Call immediately in case of emergency"
        ),
        "102": RentalEmergencyDetailsDto(
            id="102",
            emergency_contact_name="Building Manager",
            emergency_contact_phone="+380444555666",
            emergency_instructions="Contact building manager first, then emergency services if needed"
        )
    }
    
    _mock_settlement_details = {
        "101": RentalSettlementDetailsDto(
            id="101",
            check_in_instructions="Collect keys from security desk",
            check_out_instructions="Leave keys in the mailbox",
            additional_notes="Cleaning service included"
        ),
        "102": RentalSettlementDetailsDto(
            id="102",
            check_in_instructions="Use door code 1234 to enter",
            check_out_instructions="Lock the door when leaving",
            additional_notes="No pets allowed"
        )
    }
    
    _phone_to_client_mapping = {
        "+380123456789": "1",
        "+380987654321": "2"
    }
    
    @classmethod
    def create(cls, phone_number: str, client_id: Optional[str] = None, language: Language = Language.EN) -> 'MockCallSession':
        """
        Factory method to create a new mock call session with a generated UUID.
        
        Args:
            phone_number: The phone number of the caller
            client_id: Optional client identifier
            language: The preferred language for the call
            
        Returns:
            A new MockCallSession instance
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
    
    async def find_client_by_phone(self, crm_client: Any) -> Optional[ClientDto]:
        """
        Mock finding a client by phone number.
        
        Args:
            crm_client: Not used in mock implementation
            
        Returns:
            ClientDto object if found, None otherwise
        """
        client_id = self._phone_to_client_mapping.get(self.phone_number)
        if client_id:
            self.client_id = client_id
            return self._mock_clients.get(client_id)
        return None
    
    async def get_client(self, crm_client: Any) -> Optional[ClientDto]:
        """
        Mock retrieving client information by client ID.
        
        Args:
            crm_client: Not used in mock implementation
            
        Returns:
            ClientDto object if found, None otherwise
        """
        if not self.client_id:
            return None
        return self._mock_clients.get(self.client_id)
    
    async def create_client(self, crm_client: Any, client_data: Dict[str, Any]) -> Optional[ClientDto]:
        """
        Mock creating a new client.
        
        Args:
            crm_client: Not used in mock implementation
            client_data: Dictionary containing client information
            
        Returns:
            Created ClientDto object if successful, None otherwise
        """
        # Generate a new client ID
        new_id = str(len(self._mock_clients) + 1)
        
        # Create new client
        new_client = ClientDto(
            id=new_id,
            full_name=client_data.get('full_name', ''),
            phone_number=self.phone_number,
            email=client_data.get('email'),
            notes=client_data.get('notes'),
            preferred_language=UpdateClientPreferredLanguageDtoLanguage(client_data.get('preferred_language', self.language.value))
        )
        
        # Add to mock data
        self._mock_clients[new_id] = new_client
        self._phone_to_client_mapping[self.phone_number] = new_id
        
        # Update session
        self.client_id = new_id
        
        return new_client
    
    async def update_client_name(self, crm_client: Any, full_name: str) -> Optional[ClientDto]:
        """
        Mock updating client's full name.
        
        Args:
            crm_client: Not used in mock implementation
            full_name: New full name for the client
            
        Returns:
            Updated ClientDto object if successful, None otherwise
        """
        if not self.client_id or self.client_id not in self._mock_clients:
            return None
            
        client = self._mock_clients[self.client_id]
        updated_client = ClientDto(
            id=client.id,
            full_name=full_name,
            phone_number=client.phone_number,
            email=client.email,
            notes=client.notes,
            preferred_language=client.preferred_language
        )
        
        # Update mock data
        self._mock_clients[self.client_id] = updated_client
        
        return updated_client
    
    async def update_client_preferences(self, crm_client: Any, preferences: str) -> Optional[ClientDto]:
        """
        Mock updating client's preferences.
        
        Args:
            crm_client: Not used in mock implementation
            preferences: New preferences for the client
            
        Returns:
            Updated ClientDto object if successful, None otherwise
        """
        if not self.client_id or self.client_id not in self._mock_clients:
            return None
            
        client = self._mock_clients[self.client_id]
        updated_client = ClientDto(
            id=client.id,
            full_name=client.full_name,
            phone_number=client.phone_number,
            email=client.email,
            notes=preferences,  # Use notes field for preferences
            preferred_language=client.preferred_language
        )
        
        # Update mock data
        self._mock_clients[self.client_id] = updated_client
        
        return updated_client
    
    async def update_client_language(self, crm_client: Any, language: Language) -> Optional[ClientDto]:
        """
        Mock updating client's preferred language.
        
        Args:
            crm_client: Not used in mock implementation
            language: New language preference for the client
            
        Returns:
            Updated ClientDto object if successful, None otherwise
        """
        if not self.client_id or self.client_id not in self._mock_clients:
            return None
            
        # Update session language
        self.language = language
        
        client = self._mock_clients[self.client_id]
        updated_client = ClientDto(
            id=client.id,
            full_name=client.full_name,
            phone_number=client.phone_number,
            email=client.email,
            notes=client.notes,
            preferred_language=UpdateClientPreferredLanguageDtoLanguage(language.value)
        )
        
        # Update mock data
        self._mock_clients[self.client_id] = updated_client
        
        return updated_client
            
    async def get_available_rentals(self, crm_client: Any) -> Optional[List[CompactRentalDto]]:
        """
        Mock retrieving all available rentals.
        
        Args:
            crm_client: Not used in mock implementation
            
        Returns:
            List of CompactRentalDto objects
        """
        return list(self._mock_rentals.values())
    
    async def get_rental_details(self, crm_client: Any, rental_id: str) -> Optional[CompactRentalDto]:
        """
        Mock retrieving detailed information about a specific rental.
        
        Args:
            crm_client: Not used in mock implementation
            rental_id: ID of the rental to retrieve
            
        Returns:
            CompactRentalDto object if successful, None otherwise
        """
        return self._mock_rentals.get(rental_id)
    
    async def get_rental_emergency_details(self, crm_client: Any, rental_id: str) -> Optional[RentalEmergencyDetailsDto]:
        """
        Mock retrieving emergency details about a specific rental.
        
        Args:
            crm_client: Not used in mock implementation
            rental_id: ID of the rental to retrieve emergency details for
            
        Returns:
            RentalEmergencyDetailsDto object if successful, None otherwise
        """
        return self._mock_emergency_details.get(rental_id)
    
    async def get_rental_settlement_details(self, crm_client: Any, rental_id: str) -> Optional[RentalSettlementDetailsDto]:
        """
        Mock retrieving settlement details about a specific rental.
        
        Args:
            crm_client: Not used in mock implementation
            rental_id: ID of the rental to retrieve settlement details for
            
        Returns:
            RentalSettlementDetailsDto object if successful, None otherwise
        """
        return self._mock_settlement_details.get(rental_id)
            
    async def book_rental(self, crm_client: Any, rental_id: str) -> Dict[str, Any]:
        """
        Mock booking a rental for the client.
        
        Args:
            crm_client: Not used in mock implementation
            rental_id: ID of the rental to book
            
        Returns:
            A dictionary with booking status information
        """
        if not self.client_id:
            return {
                "success": False,
                "message": "Client must be identified before booking"
            }
            
        # Check if rental exists
        if rental_id not in self._mock_rentals:
            return {
                "success": False,
                "message": f"Rental with ID {rental_id} not found"
            }
            
        # Simulate successful booking
        return {
            "success": True,
            "message": "Booking request processed",
            "booking_id": str(uuid4()),
            "rental_id": rental_id,
            "client_id": self.client_id,
            "status": "pending_confirmation"
        } 