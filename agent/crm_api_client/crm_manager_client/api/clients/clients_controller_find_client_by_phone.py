from http import HTTPStatus
from typing import Any, Optional, Union

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.clients_controller_find_client_by_phone_response_200 import ClientsControllerFindClientByPhoneResponse200
from ...types import Response


def _get_kwargs(
    phone_number: str,
) -> dict[str, Any]:
    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": f"/clients/phone/{phone_number}",
    }

    return _kwargs


def _parse_response(
    *, client: Union[AuthenticatedClient, Client], response: httpx.Response
) -> Optional[ClientsControllerFindClientByPhoneResponse200]:
    if response.status_code == 200:
        response_200 = ClientsControllerFindClientByPhoneResponse200.from_dict(response.json())

        return response_200
    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: Union[AuthenticatedClient, Client], response: httpx.Response
) -> Response[ClientsControllerFindClientByPhoneResponse200]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    phone_number: str,
    *,
    client: Union[AuthenticatedClient, Client],
) -> Response[ClientsControllerFindClientByPhoneResponse200]:
    """
    Args:
        phone_number (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ClientsControllerFindClientByPhoneResponse200]
    """

    kwargs = _get_kwargs(
        phone_number=phone_number,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    phone_number: str,
    *,
    client: Union[AuthenticatedClient, Client],
) -> Optional[ClientsControllerFindClientByPhoneResponse200]:
    """
    Args:
        phone_number (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ClientsControllerFindClientByPhoneResponse200
    """

    return sync_detailed(
        phone_number=phone_number,
        client=client,
    ).parsed


async def asyncio_detailed(
    phone_number: str,
    *,
    client: Union[AuthenticatedClient, Client],
) -> Response[ClientsControllerFindClientByPhoneResponse200]:
    """
    Args:
        phone_number (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ClientsControllerFindClientByPhoneResponse200]
    """

    kwargs = _get_kwargs(
        phone_number=phone_number,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    phone_number: str,
    *,
    client: Union[AuthenticatedClient, Client],
) -> Optional[ClientsControllerFindClientByPhoneResponse200]:
    """
    Args:
        phone_number (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ClientsControllerFindClientByPhoneResponse200
    """

    return (
        await asyncio_detailed(
            phone_number=phone_number,
            client=client,
        )
    ).parsed
