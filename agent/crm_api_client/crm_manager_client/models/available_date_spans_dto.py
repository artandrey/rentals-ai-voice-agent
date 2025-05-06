from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.days_span_dto import DaysSpanDto


T = TypeVar("T", bound="AvailableDateSpansDto")


@_attrs_define
class AvailableDateSpansDto:
    """
    Attributes:
        rental_id (str):
        available_spans (list['DaysSpanDto']):
    """

    rental_id: str
    available_spans: list["DaysSpanDto"]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        rental_id = self.rental_id

        available_spans = []
        for available_spans_item_data in self.available_spans:
            available_spans_item = available_spans_item_data.to_dict()
            available_spans.append(available_spans_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "rentalId": rental_id,
                "availableSpans": available_spans,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.days_span_dto import DaysSpanDto

        d = dict(src_dict)
        rental_id = d.pop("rentalId")

        available_spans = []
        _available_spans = d.pop("availableSpans")
        for available_spans_item_data in _available_spans:
            available_spans_item = DaysSpanDto.from_dict(available_spans_item_data)

            available_spans.append(available_spans_item)

        available_date_spans_dto = cls(
            rental_id=rental_id,
            available_spans=available_spans,
        )

        available_date_spans_dto.additional_properties = d
        return available_date_spans_dto

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
