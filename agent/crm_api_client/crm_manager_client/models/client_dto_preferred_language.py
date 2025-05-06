from enum import Enum


class ClientDtoPreferredLanguage(str, Enum):
    EN = "EN"
    UK = "UK"

    def __str__(self) -> str:
        return str(self.value)
