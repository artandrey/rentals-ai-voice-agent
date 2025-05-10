from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="BookingResultDto")


@_attrs_define
class BookingResultDto:
    """
    Attributes:
        id (str):
        client_id (str):
        rental_id (str):
        start_date (str):
        end_date (str):
    """

    id: str
    client_id: str
    rental_id: str
    start_date: str
    end_date: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = self.id

        client_id = self.client_id

        rental_id = self.rental_id

        start_date = self.start_date

        end_date = self.end_date

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "clientId": client_id,
                "rentalId": rental_id,
                "startDate": start_date,
                "endDate": end_date,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        id = d.pop("id")

        client_id = d.pop("clientId")

        rental_id = d.pop("rentalId")

        start_date = d.pop("startDate")

        end_date = d.pop("endDate")

        booking_result_dto = cls(
            id=id,
            client_id=client_id,
            rental_id=rental_id,
            start_date=start_date,
            end_date=end_date,
        )

        booking_result_dto.additional_properties = d
        return booking_result_dto

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
