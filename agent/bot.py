import asyncio
import sys
import os
import json
from typing import Tuple
from uuid import uuid4

from dotenv import load_dotenv
from loguru import logger
from crm_api_client.crm_manager_client.models.book_rental_dto import BookRentalDto
from crm_api_client.crm_manager_client.api.clients import clients_controller_get_current_accommodation
from crm_api_client.crm_manager_client.models.create_client_dto import CreateClientDto
from crm_api_client.crm_manager_client.models.client_dto import ClientDto
from domain.conversation_context import ConversationContext
from crm_api_client.crm_manager_client.api.clients import clients_controller_find_client_by_phone, clients_controller_create_client
from crm_api_client.crm_manager_client.api.rentals import rentals_controller_get_rentals, rentals_controller_get_rental_by_id, rentals_controller_get_rental_available_date_spans
from crm_api_client.crm_manager_client.api.accommodations import accommodations_controller_confirm_settlement, accommodations_controller_create_booking
from select_audio_device import AudioDevice, run_device_selector

from pipecat.frames.frames import Frame, TranscriptionFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.transports.local.audio import LocalAudioTransport, LocalAudioTransportParams
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.deepgram.stt import LiveOptions
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.openai.llm import OpenAILLMContext
from pipecat.pipeline.task import PipelineParams
from pipecat_flows import FlowManager, FlowsFunctionSchema, FlowArgs, NodeConfig
load_dotenv(override=True)



async def initial_collect_full_name_handler(args: FlowArgs, flow_manager: FlowManager):
    """Handler for collecting user's full name."""
    first_name = args.get("first_name")
    last_name = args.get("last_name")
    middle_name = args.get("middle_name", "")
    logger.info(f"Collected full name: {first_name} {last_name} {middle_name}")

    created_client = await clients_controller_create_client.asyncio(
        client=crm_client,
        body=CreateClientDto(
            first_name=first_name,
            last_name=last_name,
            middle_name=middle_name,
            phone_number=flow_manager.state['context'].get_phone_number()
        )
    )
    flow_manager.state['context'].set_client(created_client)
    return {"status": "success", "first_name": first_name, "last_name": last_name, "middle_name": middle_name}

initial_collect_full_name_schema = FlowsFunctionSchema(
    name="initial_collect_full_name",
    description="Record user's full name with middle name. Call this function only once you have collected all parameters. Do not call it twice.",
    properties={"first_name": {"type": "string"}, "last_name": {"type": "string"}, "middle_name": {"type": "string"}},
    required=["first_name", "last_name"],
    handler=initial_collect_full_name_handler,
)

from crm_api_client.crm_manager_client.client import Client

crm_client = Client(base_url=os.getenv("CRM_MANAGER_URL"))

async def search_client_by_phone_number(phone_number: str):
    result = await clients_controller_find_client_by_phone.asyncio(
        client=crm_client, 
        phone_number=phone_number
    )

    return result


def create_unknown_client_initial_flow():
    flow_config = {
            "role_messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Your responses will be converted to audio."
                }
            ],
            "task_messages": [
                {
                    "role": "system",
                    "content": """Start by greeting the user with message. Use introduction message:
                    "Welcome to AI Assistant Rentals. I am your personal assistant. I can help you with booking, settlement and emergencies
                    Could you please provide me with your full name so we can continue?"
                    "
                    """
                }
            ],
            "functions": [initial_collect_full_name_schema]
    }
    return flow_config


async def get_additional_rental_details(rental_id: str):
    rental_details = await rentals_controller_get_rental_by_id.asyncio(
        client=crm_client,
        id=rental_id
    )
    return rental_details


async def get_rental_availability_handler(args: FlowArgs, flow_manager: FlowManager):
    """Handler for getting rental availability."""
    rental_id = args.get("rental_id")
    start_date = args.get("start_date")
    end_date = args.get("end_date")
    
    # Validate date formats and values
    from datetime import datetime
    current_date = datetime.now().date()
    
    # Date format validation function
    def is_valid_date_format(date_str):
        try:
            datetime.strptime(date_str, "%d-%m-%Y")
            return True
        except ValueError:
            return False
    
    # Perform validations
    if not is_valid_date_format(start_date):
        logger.error(f"Invalid start_date format: {start_date}")
        return {"status": "error", "message": f"Invalid start date format. Please use DD-MM-YYYY format."}
    
    if not is_valid_date_format(end_date):
        logger.error(f"Invalid end_date format: {end_date}")
        return {"status": "error", "message": f"Invalid end date format. Please use DD-MM-YYYY format."}
    
    # Convert strings to date objects for comparison
    start_date_obj = datetime.strptime(start_date, "%d-%m-%Y").date()
    end_date_obj = datetime.strptime(end_date, "%d-%m-%Y").date()
    
    # Check if dates are in the past
    if start_date_obj < current_date:
        logger.error(f"Start date {start_date} is in the past")
        return {"status": "error", "message": f"Start date cannot be in the past. Today is {current_date.strftime('%d-%m-%Y')}."}
    
    # Check if end date is before start date
    if end_date_obj < start_date_obj:
        logger.error(f"End date {end_date} is before start date {start_date}")
        return {"status": "error", "message": "End date cannot be before start date."}
    
    logger.info(f"Getting availability for rental ID: {rental_id}, start_date: {start_date}, end_date: {end_date}")
    try:
        availability_spans = await rentals_controller_get_rental_available_date_spans.asyncio(
            client=crm_client,
            id=rental_id,
            start_date=start_date,
            end_date=end_date
        )
        # The API might return a complex object. We need to format it or decide what to return.
        # For now, returning the raw response. This might need adjustment based on actual API response structure.
        logger.info(f"Availability spans: {availability_spans}")
        return {"status": "success", "rental_id": rental_id, "availability": availability_spans}
    except Exception as e:
        logger.error(f"Error getting rental availability: {e}")
        return {"status": "error", "message": str(e)}

get_rental_availability_schema = FlowsFunctionSchema(
    name="get_rental_availability",
    description="Get available date spans for a specific rental property. Call this function after the user has selected a rental and wants to know its availability. The dates must be in DD-MM-YYYY format.",
    properties={
        "rental_id": {"type": "string", "description": "The ID of the rental property to check availability for."},
        "start_date": {"type": "string", "description": "The start date in DD-MM-YYYY format."},
        "end_date": {"type": "string", "description": "The end date in DD-MM-YYYY format."}
    },
    required=["rental_id", "start_date", "end_date"],
    handler=get_rental_availability_handler,
)


async def confirm_settlement_handler(args: FlowArgs, flow_manager: FlowManager):
    accommodation_id = args.get("accommodation_id")
    await accommodations_controller_confirm_settlement.asyncio(
        client=crm_client,
        id=accommodation_id
    )
    return {"status": "success", "accommodation_id": accommodation_id}

confirm_settlement_schema = FlowsFunctionSchema(
    name="confirm_settlement",
    description="Confirm settlement of the accommodation.",
    properties={"accommodation_id": {"type": "string", "description": "The ID of the accommodation to confirm settlement for."}},
)

async def create_booking_handler(args: FlowArgs, flow_manager: FlowManager):
    rental_id = args.get("rental_id")
    start_date = args.get("start_date")
    end_date = args.get("end_date")
    await accommodations_controller_create_booking.asyncio(
        client=crm_client,
        body=BookRentalDto(
            rental_id=rental_id,
            start_date=start_date,
            end_date=end_date,
            client_id=flow_manager.state['context'].get_client().id
        )
    )
    return {"status": "success", "rental_id": rental_id, "start_date": start_date, "end_date": end_date}

create_booking_schema = FlowsFunctionSchema(
    name="create_booking",
    description="Create a booking for the client.",
    properties={"rental_id": {"type": "string", "description": "The ID of the rental to book."}, "start_date": {"type": "string", "description": "The start date in DD-MM-YYYY format."}, "end_date": {"type": "string", "description": "The end date in DD-MM-YYYY format."}},
)

async def create_booking_flow():
    rentals_list = await rentals_controller_get_rentals.asyncio(
        client=crm_client,
    )
    # Get current date in DD-MM-YYYY format for the system prompt
    from datetime import datetime
    current_date = datetime.now().strftime("%d-%m-%Y")
    
    flow_config = {
        "role_messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant. Your responses will be converted to audio."
            }
        ],
        "task_messages": [
            {
                "role": "system",
                "content": f"""Your goal is to help the client book accommodation.
                You are able to retrieve information about available rentals and book them.
                Today's date is {current_date}.
                Follow these steps:
                1. Present available rentals to the client one by one from the <rentals> section.
                    Example:
                    - User: "I'm looking for a place to stay."
                    - Assistant: "Okay, I can help with that. Would you like to consider the 'Comfortable apartment on the Black Avenue'?"
                    - User: "No, could you suggest another one?"
                    - Assistant: "Sure, how about the 'Luxury suite in the center of the city'?"
                2. Once the client expresses interest in a specific rental, ask them for their desired check-in and check-out dates in DD-MM-YYYY format.
                3. Use the `get_rental_availability` function to fetch available date spans. Provide the `rental_id` of the selected rental along with the `start_date` and `end_date` parameters in DD-MM-YYYY format.
                   IMPORTANT DATE VALIDATIONS:
                   - Ensure dates are in the correct DD-MM-YYYY format
                   - Check that the start_date is not in the past (today is {current_date})
                   - Verify that the end_date is after the start_date
                   - If validation fails, the function will return an error message - inform the client and ask for new dates
                4. Inform the client about the availability.
                5. If the client confirms a date and wants to book, use the `create_booking` function. Provide the `rental_id`, `start_date` (check-in), and `end_date` (check-out) for the booking. Ensure all dates are in DD-MM-YYYY format.
                6. After successfully calling `create_booking`, confirm the booking details (rental, check-in date, check-out date) with the client and inform them that their booking is complete.
                """
            },
            {
                "role": "system",
                "content": f"""
                <rentals>
                {rentals_list}
                </rentals>
                When calling `get_rental_availability` or `create_booking`, ensure you use the correct `rental_id` from the list above for the rental the user is interested in.
                Always use DD-MM-YYYY format for dates.
                Remember these validation rules for `get_rental_availability` and before calling `create_booking`:
                1. Dates must be in DD-MM-YYYY format.
                2. Start date must not be before today ({current_date}).
                3. End date must be after start date.
                If the user provides dates that don't meet these criteria, explain the issue and ask for new dates before proceeding.
                """
            }
        ],
        "functions": [get_rental_availability_schema, create_booking_schema]
    }
    return flow_config


async def route_client_to_intent_handler(args: FlowArgs, flow_manager: FlowManager):
    intent = args.get("intent")
    logger.info(f"Routing client to intent: {intent}")
    if intent == "booking":
        await flow_manager.set_node("booking",  await create_booking_flow())
    return {"status": "success", "intent": intent}

route_client_to_intent_schema = FlowsFunctionSchema(
    name="route_client_to_intent",
    description="Route client to intent handler. Client may have such intents: booking, settlement, info-or-emergency. Call this function only once you understand client's intent.",
    properties={"intent": {"type": "string"}},
    required=["intent"],
    handler=route_client_to_intent_handler,
)

async def create_end_node(context: ConversationContext) -> NodeConfig:
    """Create the final node."""
    booking_details = await clients_controller_get_current_accommodation.asyncio(
        client=crm_client,
        id=context.get_client().id
    )

    return {
        "task_messages": [
            {
                "role": "system",
                "content": (
                    f"""Thank the customer for their time and end the conversation. 
                    Mention that a representative will contact them about the quote. 
                    Client name is: {context.get_client().first_name} {context.get_client().last_name}
                    Inform client that he has booked accommodation with the following details:
                    <accommodation>
                    {booking_details}
                    </accommodation>
                    """
                ),
            }
        ],
        "functions": [],
        "post_actions": [{"type": "end_conversation"}],
    }

async def end_quote_handler(args: FlowArgs, flow_manager: FlowManager):
    flow_manager.set_node("end_quote", create_end_node())

end_quote_schema = FlowsFunctionSchema(
    name="end_quote",
    description="Ends the current process or conversation. Call this when the user indicates they are finished or the task is complete.",
    properties={},
    handler=end_quote_handler,
)

def create_client_initial_flow(context: ConversationContext):
    flow_config = {
        "role_messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant. Your responses will be converted to audio."
            }
        ],
        "task_messages": [
            {
                "role": "system",
                "content": """Start by greeting the user with message calling him by name. Use introduction message:
                "Welcome to AI Assistant Rentals. I am your personal assistant. I can help you with booking, settlement and emergencies"
                Account for note and preferences.
                After you have understood client's intent: do not respond to customer and immediately call route_client_to_intent function with intent as argument.
                """
            },
            {
                "role": "system",
                "content": f"""
                Client name is: {context.get_client().first_name} {context.get_client().last_name}
                You can call client by name.
                <note>
                {context.get_client().note}
                </note>
                <preferences>
                Client preferences are: {context.get_client().preferences}
                </preferences>
                <accommodation>
                Client accommodation is: {context.get_client_accommodation()}
                In case he has no accommodation, you should ask him to book one.
                </accommodation>
                """
            }
        ],
        "functions": [initial_collect_full_name_schema, route_client_to_intent_schema]
    }
    return flow_config


logger.remove(0)
logger.add(sys.stderr, level="DEBUG")


class TranscriptionLogger(FrameProcessor):
    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, TranscriptionFrame):
            print(f"Transcription: {frame.text}")


async def main(input_device: int, output_device: int):
    transport = LocalAudioTransport(
        LocalAudioTransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            input_device_index=input_device,
            output_device_index=output_device,
        )
    )
    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"), live_options=LiveOptions(language="en", model="nova-2", smart_format=True))

    tl = TranscriptionLogger()

    llm = OpenAILLMService(api_key=os.getenv("OPENAI_API_KEY"))
 

    context = OpenAILLMContext()
    context_aggregator = llm.create_context_aggregator(context)
    tts = CartesiaTTSService(api_key=os.getenv("CARTESIA_API_KEY"), voice_id="5c42302c-194b-4d0c-ba1a-8cb485c84ab9", model="sonic-2")

    pipeline = Pipeline([transport.input(), stt, context_aggregator.user(), llm, tts, transport.output(), context_aggregator.assistant()])

    task = PipelineTask(pipeline, params=PipelineParams(audio_in_sample_rate=16000, audio_out_sample_rate=16000,
        allow_interruptions=True))
    
    flow_manager = FlowManager(
        task=task,
        llm=llm,
        context_aggregator=context_aggregator,
        tts=tts,
    )
    phone_number="+380991111112"

    flow_manager.state['context'] = ConversationContext(
        phone_number=phone_number,
    )
    client_info = await search_client_by_phone_number(phone_number)
    if client_info is not None:
        flow_manager.state['context'].set_client(client_info)
        client_accommodation = await clients_controller_get_current_accommodation.asyncio(
            client=crm_client,
            id=client_info.id
        )
        flow_manager.state['context'].set_client_accommodation(client_accommodation)
    
        

    await flow_manager.initialize()

   
  

    if flow_manager.state['context'].get_client() is None:
        await flow_manager.set_node("initial", create_unknown_client_initial_flow())
    else:
        await flow_manager.set_node("initial", create_client_initial_flow(flow_manager.state['context']))

    runner = PipelineRunner(handle_sigint=False if sys.platform == "win32" else True)

    await runner.run(task)


if __name__ == "__main__":
    device_file = ".device"
    
    if os.path.exists(device_file):
        # Read device selections from file
        try:
            with open(device_file, "r") as f:
                device_data = json.load(f)
                input_device_index = device_data["input_device_index"]
                output_device_index = device_data["output_device_index"]
                logger.info(f"Using saved devices: input={input_device_index}, output={output_device_index}")
                asyncio.run(main(input_device_index, output_device_index))
        except Exception as e:
            logger.error(f"Error reading device file: {e}")
            # If reading fails, fall back to selector
            res: Tuple[AudioDevice, AudioDevice, int] = asyncio.run(run_device_selector())
            
            # Save the selected devices
            with open(device_file, "w") as f:
                json.dump({
                    "input_device_index": res[0].index,
                    "output_device_index": res[1].index
                }, f)
            
            asyncio.run(main(res[0].index, res[1].index))
    else:
        # Run device selector and save the selection
        res: Tuple[AudioDevice, AudioDevice, int] = asyncio.run(run_device_selector())
        
        # Save the selected devices
        with open(device_file, "w") as f:
            json.dump({
                "input_device_index": res[0].index,
                "output_device_index": res[1].index
            }, f)
        
        asyncio.run(main(res[0].index, res[1].index))