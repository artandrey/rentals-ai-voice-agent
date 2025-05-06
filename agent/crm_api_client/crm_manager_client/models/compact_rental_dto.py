from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.amenity import Amenity
    from ..models.compact_rental_dto_id import CompactRentalDtoId
    from ..models.location import Location
    from ..models.price import Price


T = TypeVar("T", bound="CompactRentalDto")


@_attrs_define
class CompactRentalDto:
    """
    Attributes:
        id (CompactRentalDtoId):
        price (Price):
        description (str):
        location (Location):
        amenities (list['Amenity']):
    """

    id: "CompactRentalDtoId"
    price: "Price"
    description: str
    location: "Location"
    amenities: list["Amenity"]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = self.id.to_dict()

        price = self.price.to_dict()

        description = self.description

        location = self.location.to_dict()

        amenities = []
        for amenities_item_data in self.amenities:
            amenities_item = amenities_item_data.to_dict()
            amenities.append(amenities_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "price": price,
                "description": description,
                "location": location,
                "amenities": amenities,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.amenity import Amenity
        from ..models.compact_rental_dto_id import CompactRentalDtoId
        from ..models.location import Location
        from ..models.price import Price

        d = dict(src_dict)
        id = CompactRentalDtoId.from_dict(d.pop("id"))

        price = Price.from_dict(d.pop("price"))

        description = d.pop("description")

        location = Location.from_dict(d.pop("location"))

        amenities = []
        _amenities = d.pop("amenities")
        for amenities_item_data in _amenities:
            amenities_item = Amenity.from_dict(amenities_item_data)

            amenities.append(amenities_item)

        compact_rental_dto = cls(
            id=id,
            price=price,
            description=description,
            location=location,
            amenities=amenities,
        )

        compact_rental_dto.additional_properties = d
        return compact_rental_dto

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
