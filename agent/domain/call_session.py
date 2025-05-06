from dataclasses import dataclass
from typing import Optional
from uuid import UUID, uuid4


@dataclass
class CallSession:
    """
    Represents a call session with a client.
    
    Attributes:
        id: Unique identifier for the call session
        phone_number: The phone number of the caller
        client_id: Optional client identifier if the caller is a known client
    """
    id: UUID
    phone_number: str
    client_id: Optional[str] = None
    
    @classmethod
    def create(cls, phone_number: str, client_id: Optional[str] = None) -> 'CallSession':
        """
        Factory method to create a new call session with a generated UUID.
        
        Args:
            phone_number: The phone number of the caller
            client_id: Optional client identifier
            
        Returns:
            A new CallSession instance
        """
        return cls(
            id=uuid4(),
            phone_number=phone_number,
            client_id=client_id
        )
    
    def is_identified(self) -> bool:
        """
        Checks if the call session has an identified client.
        
        Returns:
            True if client_id is present, False otherwise
        """
        return self.client_id is not None 