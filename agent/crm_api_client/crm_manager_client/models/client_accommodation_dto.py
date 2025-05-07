from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.compact_rental_dto import CompactRentalDto
    from ..models.date_day_dto import DateDayDto


T = TypeVar("T", bound="ClientAccommodationDto")


@_attrs_define
class ClientAccommodationDto:
    """
    Attributes:
        id (str):
        client_id (str):
        rental_id (str):
        start_date (DateDayDto):
        end_date (DateDayDto):
        status (str):
        rental (CompactRentalDto):
    """

    id: str
    client_id: str
    rental_id: str
    start_date: "DateDayDto"
    end_date: "DateDayDto"
    status: str
    rental: "CompactRentalDto"
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = self.id

        client_id = self.client_id

        rental_id = self.rental_id

        start_date = self.start_date.to_dict()

        end_date = self.end_date.to_dict()

        status = self.status

        rental = self.rental.to_dict()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "clientId": client_id,
                "rentalId": rental_id,
                "startDate": start_date,
                "endDate": end_date,
                "status": status,
                "rental": rental,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.compact_rental_dto import CompactRentalDto
        from ..models.date_day_dto import DateDayDto

        d = dict(src_dict)
        id = d.pop("id")

        client_id = d.pop("clientId")

        rental_id = d.pop("rentalId")

        start_date = DateDayDto.from_dict(d.pop("startDate"))

        end_date = DateDayDto.from_dict(d.pop("endDate"))

        status = d.pop("status")

        rental = CompactRentalDto.from_dict(d.pop("rental"))

        client_accommodation_dto = cls(
            id=id,
            client_id=client_id,
            rental_id=rental_id,
            start_date=start_date,
            end_date=end_date,
            status=status,
            rental=rental,
        )

        client_accommodation_dto.additional_properties = d
        return client_accommodation_dto

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
