from http import HTTPStatus
from typing import Any, Optional, Union

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.available_date_spans_dto import AvailableDateSpansDto
from ...types import UNSET, Response


def _get_kwargs(
    id: str,
    *,
    start_date: str,
    end_date: str,
) -> dict[str, Any]:
    params: dict[str, Any] = {}

    params["startDate"] = start_date

    params["endDate"] = end_date

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": f"/rentals/{id}/available-dates",
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: Union[AuthenticatedClient, Client], response: httpx.Response
) -> Optional[AvailableDateSpansDto]:
    if response.status_code == 200:
        response_200 = AvailableDateSpansDto.from_dict(response.json())

        return response_200
    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: Union[AuthenticatedClient, Client], response: httpx.Response
) -> Response[AvailableDateSpansDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    id: str,
    *,
    client: Union[AuthenticatedClient, Client],
    start_date: str,
    end_date: str,
) -> Response[AvailableDateSpansDto]:
    """
    Args:
        id (str):
        start_date (str):
        end_date (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AvailableDateSpansDto]
    """

    kwargs = _get_kwargs(
        id=id,
        start_date=start_date,
        end_date=end_date,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    id: str,
    *,
    client: Union[AuthenticatedClient, Client],
    start_date: str,
    end_date: str,
) -> Optional[AvailableDateSpansDto]:
    """
    Args:
        id (str):
        start_date (str):
        end_date (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AvailableDateSpansDto
    """

    return sync_detailed(
        id=id,
        client=client,
        start_date=start_date,
        end_date=end_date,
    ).parsed


async def asyncio_detailed(
    id: str,
    *,
    client: Union[AuthenticatedClient, Client],
    start_date: str,
    end_date: str,
) -> Response[AvailableDateSpansDto]:
    """
    Args:
        id (str):
        start_date (str):
        end_date (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AvailableDateSpansDto]
    """

    kwargs = _get_kwargs(
        id=id,
        start_date=start_date,
        end_date=end_date,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    id: str,
    *,
    client: Union[AuthenticatedClient, Client],
    start_date: str,
    end_date: str,
) -> Optional[AvailableDateSpansDto]:
    """
    Args:
        id (str):
        start_date (str):
        end_date (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AvailableDateSpansDto
    """

    return (
        await asyncio_detailed(
            id=id,
            client=client,
            start_date=start_date,
            end_date=end_date,
        )
    ).parsed
