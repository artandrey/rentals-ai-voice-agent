import asyncio
import sys
import os
import json
from typing import Tuple
from uuid import uuid4

from dotenv import load_dotenv
from loguru import logger
from crm_api_client.crm_manager_client.api.clients import clients_controller_get_current_accommodation
from crm_api_client.crm_manager_client.models.create_client_dto import CreateClientDto
from crm_api_client.crm_manager_client.models.client_dto import ClientDto
from domain.conversation_context import ConversationContext
from crm_api_client.crm_manager_client.api.clients import clients_controller_find_client_by_phone, clients_controller_create_client
from crm_api_client.crm_manager_client.api.rentals import rentals_controller_get_rentals
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
from pipecat_flows import FlowManager, FlowsFunctionSchema, FlowArgs
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


async def create_booking_flow():
    rentals_list = await rentals_controller_get_rentals.asyncio(
        client=crm_client,
    )
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
                "content": """Your goal is to help the client book accommodation.
                You are able to retrieve information about available rentals and book them.
                1. Retrieve information about available rentals in <rentals> section and present it to client.
                    1.1. You should present single rental at a time.
                    Example:
                    - Would you like to book "Comfortable apartment on the Black Avenue"
                    - No, could you suggest me another one?
                    - Sure, probably you would like to book "Luxury suite in the center of the city"
                2. If client agrees, search for availability of selected accommodation.
                    2.1. You should search for availability of selected accommodation in range of dates.
                """
            },
            {
                "role": "system",
                "content": f"""
                <rentals>
                {rentals_list}
                </rentals>
                """
            }
        ],
        "functions": []
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
                After you have understood client's intent, call route_client_to_intent function with intent as argument.
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