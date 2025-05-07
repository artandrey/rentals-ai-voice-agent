from collections.abc import Mapping
from typing import Any, TypeVar, Union, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="ClientDto")


@_attrs_define
class ClientDto:
    """
    Attributes:
        id (str):
        first_name (str):
        last_name (str):
        middle_name (Union[None, str]):
        phone_number (str):
        preferred_language (Union[None, str]):
        preferences (list[str]):
        note (Union[None, str]):
    """

    id: str
    first_name: str
    last_name: str
    middle_name: Union[None, str]
    phone_number: str
    preferred_language: Union[None, str]
    preferences: list[str]
    note: Union[None, str]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = self.id

        first_name = self.first_name

        last_name = self.last_name

        middle_name: Union[None, str]
        middle_name = self.middle_name

        phone_number = self.phone_number

        preferred_language: Union[None, str]
        preferred_language = self.preferred_language

        preferences = self.preferences

        note: Union[None, str]
        note = self.note

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "firstName": first_name,
                "lastName": last_name,
                "middleName": middle_name,
                "phoneNumber": phone_number,
                "preferredLanguage": preferred_language,
                "preferences": preferences,
                "note": note,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        id = d.pop("id")

        first_name = d.pop("firstName")

        last_name = d.pop("lastName")

        def _parse_middle_name(data: object) -> Union[None, str]:
            if data is None:
                return data
            return cast(Union[None, str], data)

        middle_name = _parse_middle_name(d.pop("middleName"))

        phone_number = d.pop("phoneNumber")

        def _parse_preferred_language(data: object) -> Union[None, str]:
            if data is None:
                return data
            return cast(Union[None, str], data)

        preferred_language = _parse_preferred_language(d.pop("preferredLanguage"))

        preferences = cast(list[str], d.pop("preferences"))

        def _parse_note(data: object) -> Union[None, str]:
            if data is None:
                return data
            return cast(Union[None, str], data)

        note = _parse_note(d.pop("note"))

        client_dto = cls(
            id=id,
            first_name=first_name,
            last_name=last_name,
            middle_name=middle_name,
            phone_number=phone_number,
            preferred_language=preferred_language,
            preferences=preferences,
            note=note,
        )

        client_dto.additional_properties = d
        return client_dto

    @property
    def additional_keys(self) -> list[str]:
        return list(self.additional_properties.keys())

    def __getitem__(self, key: str) -> Any:
        return self.additional_properties[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self.additional_properties[key] = value

    def __delitem__(self, key: str) -> None:
        del self.additional_properties[key]

    def __contains__(self, key: str) -> bool:
        return key in self.additional_properties
