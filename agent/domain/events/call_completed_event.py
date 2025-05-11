from typing import List, Dict, Any

class Replica:
    def __init__(self, role: str, text: str):
        self.role = role
        self.text = text

    def to_dict(self) -> dict:
        return {"role": self.role, "text": self.text}

    def to_plain(self) -> dict:
        return {"role": self.role, "text": self.text}

class CallCompletedEvent:
    def __init__(self, intent: str, client_id: str, accommodation_id: str, transcript: List[Replica], audio_file_id: str):
        """
        :param intent: The intent of the call (e.g., booking, inquiry, etc.)
        :param client_id: The unique identifier for the client
        :param accommodation_id: The unique identifier for the accommodation
        :param transcript: A list of Replica objects from assistant and user.
        :param audio_file_id: The identifier for the associated audio file
        """
        self.intent = intent
        self.client_id = client_id
        self.accommodation_id = accommodation_id
        self.transcript = transcript
        self.audio_file_id = audio_file_id

    def to_dict(self) -> dict:
        return {
            "intent": self.intent,
            "client_id": self.client_id,
            "accommodation_id": self.accommodation_id,
            "transcript": [r.to_dict() for r in self.transcript],
            "audio_file_id": self.audio_file_id,
        }

    def to_plain(self) -> dict:
        """
        Returns a dictionary with all properties in camelCase.
        """
        return {
            "intent": self.intent,
            "clientId": self.client_id,
            "accommodationId": self.accommodation_id,
            "transcript": [r.to_plain() for r in self.transcript],
            "audioFileId": self.audio_file_id,
        } 