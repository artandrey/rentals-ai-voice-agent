from typing import List, Dict, Any

class CallCompletedEvent:
    def __init__(self, intent: str, client_id: str, accommodation_id: str, transcript: List[Dict[str, Any]], audio_file_id: str):
        """
        :param intent: The intent of the call (e.g., booking, inquiry, etc.)
        :param client_id: The unique identifier for the client
        :param accommodation_id: The unique identifier for the accommodation
        :param transcript: A list of replicas (utterances) from assistant and user. Each item should be a dict with at least 'role' and 'text'.
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
            "transcript": self.transcript,
            "audio_file_id": self.audio_file_id,
        } 