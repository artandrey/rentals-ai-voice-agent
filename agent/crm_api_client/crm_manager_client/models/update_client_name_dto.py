from collections.abc import Mapping
from typing import Any, TypeVar, Union

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

T = TypeVar("T", bound="UpdateClientNameDto")


@_attrs_define
class UpdateClientNameDto:
    """
    Attributes:
        first_name (str):
        last_name (str):
        middle_name (Union[Unset, str]):
    """

    first_name: str
    last_name: str
    middle_name: Union[Unset, str] = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        first_name = self.first_name

        last_name = self.last_name

        middle_name = self.middle_name

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "firstName": first_name,
                "lastName": last_name,
            }
        )
        if middle_name is not UNSET:
            field_dict["middleName"] = middle_name

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        first_name = d.pop("firstName")

        last_name = d.pop("lastName")

        middle_name = d.pop("middleName", UNSET)

        update_client_name_dto = cls(
            first_name=first_name,
            last_name=last_name,
            middle_name=middle_name,
        )

        update_client_name_dto.additional_properties = d
        return update_client_name_dto

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
