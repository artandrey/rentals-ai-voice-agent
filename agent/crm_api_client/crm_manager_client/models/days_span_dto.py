from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="DaysSpanDto")


@_attrs_define
class DaysSpanDto:
    """
    Attributes:
        start_date (str):
        end_date (str):
        days_count (float):
    """

    start_date: str
    end_date: str
    days_count: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        start_date = self.start_date

        end_date = self.end_date

        days_count = self.days_count

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "startDate": start_date,
                "endDate": end_date,
                "daysCount": days_count,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        start_date = d.pop("startDate")

        end_date = d.pop("endDate")

        days_count = d.pop("daysCount")

        days_span_dto = cls(
            start_date=start_date,
            end_date=end_date,
            days_count=days_count,
        )

        days_span_dto.additional_properties = d
        return days_span_dto

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
