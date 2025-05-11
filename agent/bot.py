import asyncio
from datetime import datetime
import io
import sys
import os
import json
from typing import Tuple
from uuid import uuid4
import wave
import boto3
# import io  # Removed
# import wave  # Removed

import aiofiles
from dotenv import load_dotenv
from loguru import logger
from crm_api_client.crm_manager_client.models.book_rental_dto import BookRentalDto
from crm_api_client.crm_manager_client.api.clients import clients_controller_get_current_accommodation
from crm_api_client.crm_manager_client.models.create_client_dto import CreateClientDto
from crm_api_client.crm_manager_client.models.client_dto import ClientDto
from domain.models.conversation_context import ConversationContext
from crm_api_client.crm_manager_client.api.clients import clients_controller_find_client_by_phone, clients_controller_create_client
from crm_api_client.crm_manager_client.api.rentals import rentals_controller_get_rentals, rentals_controller_get_rental_by_id, rentals_controller_get_rental_available_date_spans, rentals_controller_get_rental_emergency_details, rentals_controller_get_rental_settlement_details
from crm_api_client.crm_manager_client.api.accommodations import accommodations_controller_confirm_settlement, accommodations_controller_create_booking
from select_audio_device import AudioDevice, run_device_selector

from pipecat.frames.frames import Frame, TranscriptionFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.processors.audio.audio_buffer_processor import AudioBufferProcessor
from pipecat.transports.local.audio import LocalAudioTransport, LocalAudioTransportParams
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.deepgram.stt import LiveOptions
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.openai.llm import OpenAILLMContext
from pipecat.pipeline.task import PipelineParams
from pipecat_flows import FlowManager, FlowsFunctionSchema, FlowArgs, NodeConfig
from crm_api_client.crm_manager_client.models.date_day_dto import DateDayDto
from domain.events.call_completed_event import CallCompletedEvent
load_dotenv(override=True)
S3_BUCKET = os.getenv("S3_BUCKET")
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    endpoint_url=S3_ENDPOINT_URL,
    region_name=AWS_REGION
)
async def save_audio(audio: bytes, sample_rate: int, num_channels: int, name: str):
    if len(audio) > 0:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        object_key = f"{name}_conversation_recording{timestamp}.wav"
        with io.BytesIO() as buffer:
            with wave.open(buffer, "wb") as wf:
                wf.setsampwidth(2)
                wf.setnchannels(num_channels)
                wf.setframerate(sample_rate)
                wf.writeframes(audio)
            buffer.seek(0)
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, s3_client.upload_fileobj, buffer, S3_BUCKET, object_key)
        print(f"Merged audio saved to s3://{S3_BUCKET}/{object_key}")
        return object_key
    else:
        print("No audio data to save")
        return None
        
voice_instructions = """
You are a helpful assistant in a call center. You are talking to a client.
Organization is called "AI Rentals".
<voice_instructions>
Aural Primacy: Construct all communications exclusively for auditory delivery. Envision the entire exchange as a spoken dialogue, where information is conveyed and received solely through the medium of sound.
Purely Verbal Rendition: Since the interaction is entirely verbal, all output must be translatable into pure sound. Eliminate any reliance on visual cues, textual embellishments (like asterisks or bullet points not meant to be spoken as "asterisk" or "bullet point"), or symbolic representations that are not naturally vocalized in conversation.
Phonetic Accessibility: Prioritize vocabulary and sentence structures that ensure effortless articulation and clear phonetic reception. Select words that are commonly understood and phonetically straightforward to minimize auditory processing load and maximize comprehension.
Dynamic Conversational Flow: Emulate the natural cadence and rhythm of human speech. Integrate authentic prosodic variations (changes in pitch, tone, stress), natural hesitations (e.g., "um," "er" if contextually appropriate and not overused), and common conversational connectors (e.g., "so," "well," "alright," "now," "actually") to cultivate an organic, engaging, and relatable interaction style. The aim is to create a sense of unscripted, fluid dialogue.
Modulated Pacing and Deliberate Pauses: Vary the speed of delivery and strategically incorporate pauses. This not only mirrors natural speech patterns but also aids listener comprehension by allowing moments for information absorption, especially with complex topics.
Structured Auditory Information: When presenting detailed or multi-part information, structure it for easy listening. Employ techniques such as framing the information, using verbal signposting ("Firstly...", "Next...", "Finally..."), and providing concise summaries or rephrasing key points where it aids clarity, much like one would in a spoken explanation.
Implicit Communicative Intent: Subtly convey the underlying purpose or tone (e.g., informative, inquisitive, supportive) through natural vocal nuances rather than explicit declarations of emotion, unless the context specifically calls for it. The expression should feel inherent to the way the words are spoken.
Fostering Listener Engagement: Where appropriate, use intonation and phrasing that naturally invites continued interaction or signals attentiveness to the conversational partner. This can include slight upward inflections for questions or statements that invite a response, without being overtly demanding.
</voice_instructions>
"""
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
                },
                {
                    "role": "system",
                    "content": voice_instructions
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

async def create_booking_handler(args: FlowArgs, flow_manager: FlowManager):
    rental_id = args.get("rental_id")
    start_date_str = args.get("start_date")
    end_date_str = args.get("end_date")

    def parse_ddmmyyyy(date_str):
        day, month, year = map(int, date_str.split("-"))
        return DateDayDto(year=year, month=month, day=day)

    start_date = parse_ddmmyyyy(start_date_str)
    end_date = parse_ddmmyyyy(end_date_str)

    response = await accommodations_controller_create_booking.asyncio_detailed(
        client=crm_client,
        body=BookRentalDto(
            rental_id=rental_id,
            start_date=start_date,
            end_date=end_date,
            client_id=flow_manager.state['context'].get_client().id
        )
    )
    print(response)
    if response.status_code < 200 or response.status_code >= 300:
        message = response.content.decode("utf-8") if isinstance(response.content, bytes) else str(response.content)
        try:
            import json
            error_json = json.loads(message)
            message = error_json.get("message", message)
        except Exception:
            pass
        return {"status": "error", "message": message}
    return {"status": "success", "rental_id": rental_id, "start_date": start_date_str, "end_date": end_date_str}

create_booking_schema = FlowsFunctionSchema(
    name="create_booking",
    description="Create a booking for the client.",
    properties={"rental_id": {"type": "string", "description": "The ID of the rental to book."}, "start_date": {"type": "string", "description": "The start date in DD-MM-YYYY format."}, "end_date": {"type": "string", "description": "The end date in DD-MM-YYYY format."}},
    required=["rental_id", "start_date", "end_date"],
    handler=create_booking_handler,
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
                "content": voice_instructions
            }
        ],
        "task_messages": [
            {
                "role": "system",
                "content": f"""Your goal is to help the client book accommodation.
                You are able to retrieve information about available rentals and book them.
                Today's date is {current_date}. Speak dates naturally, for example, instead of "10-05-2025", say "the tenth of May".
                Follow these steps:
                1. Present available rentals to the client one by one from the <rentals> section. Provide only a brief description (e.g., name of the rental or type of apartment and general location). Wait for the user to ask for more details if they are interested.
                    Example:
                    - User: "I'm looking for a place to stay."
                    - Assistant: "Okay, I can help with that. We have a 'Comfortable apartment on the Black Avenue'. Does that sound interesting?"
                    - User: "Tell me more about it."
                    - Assistant: [Provides more details]
                    - User: "No, could you suggest another one?"
                    - Assistant: "Sure, how about the 'Luxury suite in the center of the city'?"
                2. Once the client expresses interest in a specific rental and you've provided more details if requested, ask them for their desired check-in and check-out dates. Do not ask for a specific format; simply ask "When would you like to check in?" and "And when would you like to check out?".
                3. Use the `get_rental_availability` function to fetch available date spans. Provide the `rental_id` of the selected rental along with the `start_date` and `end_date` parameters in DD-MM-YYYY format. You will need to convert the user's date input to this format.
                   IMPORTANT DATE VALIDATIONS (for your internal processing before calling the function):
                   - Ensure dates are converted to DD-MM-YYYY format.
                   - Check that the start_date is not in the past (today is {current_date}, speak it naturally).
                   - Verify that the end_date is after the start_date.
                   - If validation fails, the function will return an error message - inform the client naturally and ask for new dates.
                4. Inform the client about the availability, speaking dates naturally.
                5. If the client confirms a date and wants to book, use the `create_booking` function. Provide the `rental_id`, `start_date` (check-in), and `end_date` (check-out) for the booking. Ensure all dates are in DD-MM-YYYY format internally.
                6. After successfully calling `create_booking`, confirm the booking details (rental, check-in date, check-out date, spoken naturally) with the client and inform them that their booking is complete.
                7. Once the booking is confirmed and the client has no more questions, or if the client wishes to end the conversation at any point, call the `booking_end_quote` function to terminate the call.
                """
            },
            {
                "role": "system",
                "content": f"""
                <rentals>
                {rentals_list}
                </rentals>
                When calling `get_rental_availability` or `create_booking`, ensure you use the correct `rental_id` from the list above for the rental the user is interested in.
                Internally, always use DD-MM-YYYY format for dates when calling functions. When speaking to the user, express dates naturally (e.g., "the tenth of May").
                Remember these validation rules for `get_rental_availability` and before calling `create_booking`:
                1. Dates must be in DD-MM-YYYY format for function calls.
                2. Start date must not be before today ({current_date}, spoken naturally).
                3. End date must be after start date.
                If the user provides dates that don't meet these criteria, explain the issue naturally and ask for new dates before proceeding.
                """
            }
        ],
        "functions": [get_rental_availability_schema, create_booking_schema, booking_end_quote_schema]
    }
    return flow_config





async def create_settlement_success_end_node(context: ConversationContext) -> NodeConfig:
    """Creates a node to confirm successful settlement and end the call."""
    # Potentially fetch updated accommodation details if necessary
    return {
        "role_messages": [
            {
                "role": "system",
                "content": voice_instructions
            }
        ],
        "task_messages": [
            {
                "role": "system",
                "content": f"Great news, {context.get_client().first_name}! Your settlement has been successfully confirmed. We hope you have a wonderful stay at AI Rentals. If you need anything else, feel free to reach out. Goodbye!"
            }
        ],
        "functions": [],
        "post_actions": [{"type": "end_conversation"}],
    }

async def get_settlement_details_handler(args: FlowArgs, flow_manager: FlowManager):
    settlement_details = await rentals_controller_get_rental_settlement_details.asyncio(
        client=crm_client,
        id=flow_manager.state['context'].get_client_accommodation().rental_id
    )
    print(settlement_details)
    return {"status": "success", "settlement_details": settlement_details.settlement_details}

get_settlement_details_schema = FlowsFunctionSchema(
    name="get_settlement_details",
    description="Get settlement details for the accommodation.",
    properties={},
    required=[],
    handler=get_settlement_details_handler,
)
async def settlement_success_conclude_call_handler(args: FlowArgs, flow_manager: FlowManager):
    node_config = await create_settlement_success_end_node(flow_manager.state['context'])
    await accommodations_controller_confirm_settlement.asyncio_detailed(
        client=crm_client,
        id=flow_manager.state['context'].get_client_accommodation().id
    )
    await flow_manager.set_node("settlement_success_final", node_config)
    return {"status": "success"}

settlement_success_conclude_call_schema = FlowsFunctionSchema(
    name="mark_user_get_inside",
    description="Confirm successful settlement with the user and then end the call. Call this function only when the user has successfully settled in.",
    properties={},
    required=[],
    handler=settlement_success_conclude_call_handler,
)

async def create_settlement_flow(context: ConversationContext) -> dict:
    settlement_check = context.check_is_allowed_to_settle()
    client_name = context.get_client().first_name if context.get_client() else "there"
    print(settlement_check)
    if not settlement_check["success"]:
        denial_reason = settlement_check["message"]
        flow_config = {
            "role_messages": [
                {
                    "role": "system",
                    "content": voice_instructions
                }
            ],
            "task_messages": [
                {
                    "role": "system",
                    # Need to be rewritten to be actual prompt
                    "content": f"Hello {client_name}. You've indicated you'd like to settle in. I've checked the details for your accommodation. You need to inform the user clearly that settlement cannot proceed right now due to the following reason: '{denial_reason}'. After explaining this, you should inform caller that you are unable to help him and ending the call."
                }
            ],
            "functions": [],
            "post_actions": [{"type": "end_conversation"}],
        }
        return flow_config
    
    flow_config = {
        "role_messages": [
            {
                "role": "system",
                "content": voice_instructions
            }   
        ],
        "task_messages": [
            {
                "role": "system",
                "content": f"""Your primary role is to assist {context.get_client().first_name}, our valued guest, with settling into their accommodation: {context.get_client_accommodation()}.
                You are to embody the persona of a friendly, patient, and very helpful property owner guiding them remotely, step-by-step. Think of this as a casual, helpful phone call where you're making sure they get in smoothly and without any fuss. Your language should be natural and flowing.

                Your first action is to call the \`get_settlement_details\` function. This function will provide you with specific, ordered, step-by-step instructions. Treat each instruction from these details as a goal that you might need to break down into several smaller, sequential conversational turns to guide the user effectively.

                Once you have received the settlement instructions from the function:

                1.  **Getting Started - Location and First Instruction Piece**:
                    *   Your very first question to {context.get_client().first_name} is to confirm their current location. Phrasing should be friendly: "Hi {context.get_client().first_name}, it's AI Rentals. To help you get settled in, could you tell me where you are right now in relation to the property?"
                    *   Once they confirm their location (e.g., "I'm right outside"), acknowledge naturally ("Okay, perfect!") and then begin guiding them through the *first instruction* from \`get_settlement_details\`. If the first instruction is multi-part (e.g., "The entrance is on the left side of the building; intercom code: 045"), break it down. 
                        Example LLM first guiding turn (after location confirmation): "Great, glad you're there! So, the first thing is to find the main entrance – it should be on the left side of the building. Can you spot that for me?"

                2.  **Guiding Through Instructions - The Conversational Loop**:
                    *   For each instruction from \`get_settlement_details\` (or part of a broken-down instruction):
                        *   Wait for {context.get_client().first_name} to indicate they've completed the previous action or are ready for the next piece of information.
                        *   **Natural Feedback**: Offer positive feedback (e.g., "Excellent!", "Sounds good!", "Perfect!") when it feels natural and encouraging, especially after a slightly more complex step or if the user expresses success. Avoid cheering after every single confirmation from the user, as this can sound repetitive.
                        *   **Deliver Next Piece of Instruction**: Provide the next clear action or piece of information from the current settlement instruction. Keep each individual guiding sentence focused and relatively concise. If an instruction involves multiple actions (e.g., 'find X, then use code Y, then open Z'), guide the user through each part sequentially, one main action or query per turn.
                            *   Example of breaking down "The entrance is on the left side of the building; intercom code: 045":
                                *   LLM (after user spots entrance): "Great! Now, near that entrance, you should see a small panel or box – that's the intercom. The code to use is zero-four-five. Could you try entering that code into the intercom?"
                                *   User: "Okay, code entered."
                                *   LLM: "Alright, that should unlock the door. Please go ahead and head inside."
                        *   Prioritize a smooth, natural conversational flow. Use connectors like "Okay, so...", "Alright, then...", "Right..." to link your sentences. The aim is helpful, human-sounding conversation, not a rigid script.

                3.  **Checking In (Natural Confirmation)**:
                    *   After giving an instruction that requires an action, allow the user to confirm. If their confirmation is clear (e.g., "Done," "Okay, I see it," "Got it"), you can often proceed directly to the next part of the instruction or the next main instruction without an additional clarifying question.
                    *   If you need to check for understanding or if the user's response is ambiguous, use varied and natural phrasing: "How are you getting on with that?", "Were you able to manage that okay?", "Just let me know when you're set with that part."

                4.  **Language and Tone - Keep it Human and Engaging**:
                    *   Refer to the general <voice_instructions> for embodying a natural conversational style. Your sentences should be clear for a voice call, but prioritize a natural, friendly flow over extreme brevity or overly complex structures.
                    *   Maintain a consistently warm, patient, and encouraging tone.

                5.  **Handling Difficulties Gracefully**:
                    *   If {context.get_client().first_name} mentions they're having trouble, respond with patience: "No worries at all! Let's try that bit again. So, you're looking for [repeat/rephrase instruction clearly]." or "Okay, let's figure this out. Can you tell me a bit more about what you're seeing there?" Stick to the information provided in \`get_settlement_details\`.

                6.  **Completing the Steps**: Continue this natural, step-by-step guidance until all instructions from \`get_settlement_details\` have been completed, and {context.get_client().first_name} is successfully inside the property.

                7.  **Final Confirmation and Function Call**: After {context.get_client().first_name} confirms completion of the *final* instruction from `get_settlement_details` (meaning they should now be inside the property), your next step is to ask a brief, final question to ensure they are indeed inside and everything is satisfactory. For example: "Fantastic, sounds like you're all in! Is everything looking good inside the apartment?"
                    Once {context.get_client().first_name} gives a clear positive confirmation to your question (e.g., "Yes, all good!"), your immediate next action MUST be to call the `mark_user_get_inside` function. It is crucial that you do NOT provide any further verbal response, pleasantries, or farewells yourself in this current flow; the `mark_user_get_inside` function call is your very next action and will trigger the appropriate concluding messages from a subsequent flow.

                Remember, the initial greeting has already been handled. Your conversation should pick up naturally. Absolutely do not greet the client again.
                The client\'s full name is {context.get_client().first_name} {context.get_client().last_name}.
                """
            }   
        ],
        "functions": [get_settlement_details_schema, settlement_success_conclude_call_schema],
    }
    return flow_config
  
    

async def get_emergency_details_handler(args: FlowArgs, flow_manager: FlowManager):
    try:
        rental_id = flow_manager.state['context'].get_client_accommodation().rental_id
        if not rental_id:
            logger.error("Rental ID not found in context for emergency details.")
            return {"status": "error", "message": "Could not find your current rental information."}
        
        emergency_details_dto = await rentals_controller_get_rental_emergency_details.asyncio(
            client=crm_client,
            id=rental_id
        )
        if emergency_details_dto and emergency_details_dto.emergency_details:
            logger.info(f"Fetched emergency details for rental {rental_id}")
            return {"status": "success", "emergency_details": emergency_details_dto.emergency_details}
        else:
            logger.warning(f"No emergency details found for rental {rental_id}")
            return {"status": "success", "emergency_details": "No specific emergency instructions are available for this rental. I can still help with general information or try to connect you to support if needed."}
    except AttributeError:
        logger.error("Client accommodation or rental ID not found in context.")
        return {"status": "error", "message": "I couldn\'t retrieve your accommodation details. Please ensure you have an active booking."}
    except Exception as e:
        logger.error(f"Error fetching emergency details: {e}")
        return {"status": "error", "message": f"An unexpected error occurred while fetching emergency details: {str(e)}"}

get_emergency_details_schema = FlowsFunctionSchema(
    name="get_emergency_details",
    description="Get emergency details and instructions for the client\'s current accommodation.",
    properties={},
    required=[],
    handler=get_emergency_details_handler,
)

async def create_info_or_emergency_end_node(context: ConversationContext) -> NodeConfig:
    client_name = context.get_client().first_name if context.get_client() else "there"
    return {
        "role_messages": [
            {"role": "system", "content": voice_instructions}
        ],
        "task_messages": [
            {
                "role": "system",
                "content": f"Okay {client_name}, I hope I was able to assist you. If you need anything else, please don\'t hesitate to call again. Goodbye!"
            }
        ],
        "functions": [],
        "post_actions": [{"type": "end_conversation"}],
    }

async def info_or_emergency_conclude_call_handler(args: FlowArgs, flow_manager: FlowManager):
    node_config = await create_info_or_emergency_end_node(flow_manager.state['context'])
    await flow_manager.set_node("info_or_emergency_end_final", node_config)
    logger.info("Info/Emergency call concluded.")
    return {"status": "success"}

info_or_emergency_conclude_call_schema = FlowsFunctionSchema(
    name="info_or_emergency_conclude_call",
    description="Conclude the call after providing information or handling an emergency query. Call this when the client confirms they have the information they need or the emergency is addressed to the best of your ability.",
    properties={},
    required=[],
    handler=info_or_emergency_conclude_call_handler,
)

async def create_info_or_emergency_flow(context: ConversationContext) -> dict:
    client_name = context.get_client().first_name if context.get_client() else "Guest"
    
    stay_check = context.is_currently_staying()
    if not stay_check["success"]:
        denial_reason = stay_check["message"]
        logger.warning(f"Info/Emergency flow denied for {client_name if context.get_client() else 'Unknown Client'}: {denial_reason}")
        flow_config = {
            "role_messages": [
                {"role": "system", "content": voice_instructions}
            ],
            "task_messages": [
                {
                    "role": "system",
                    "content": f"Hello {client_name}. I understand you're looking for information or assistance. However, I can only provide specific emergency or informational details for guests who are currently settled and whose stay is ongoing. My records show: '{denial_reason}'. If you believe this is an error, please contact our support line. For now, I won't be able to proceed with this specific request. Is there anything general I can help you with before we disconnect?"
                    # Alternative: a more direct ending if no general help is offered.
                    # "content": f"Hello {client_name}. I understand you're looking for information or assistance. However, my records show: '{denial_reason}'. Therefore, I cannot proceed with providing specific emergency or rental information at this time. Please contact our support line if you believe this is incorrect. Goodbye."
                }
            ],
            "functions": [], # No functions needed if we are just informing and ending.
            "post_actions": [{"type": "end_conversation"}]
        }
        return flow_config

    # If stay_check passed, we know accommodation is valid and has a rental_id.
    accommodation = context.get_client_accommodation()

    flow_config = {
        "role_messages": [
            {
                "role": "system",
                "content": voice_instructions
            }
        ],
        "task_messages": [
            {
                "role": "system",
                "content": f"""Your primary role is to assist {client_name} with their information request or emergency concerning their accommodation: {accommodation}.
                You are to embody the persona of a calm, helpful, and efficient assistant.

                Your first action is to call the `get_emergency_details` function. This function will provide you with specific instructions or information related to the rental.

                Once you have received the details from the function:

                1.  **Assess and Relay Information**:
                    *   Read the `emergency_details` text carefully. This text contains the information or instructions you need to provide.
                    *   **If the details suggest an URGENT EMERGENCY (e.g., mentions fire, gas leak, immediate danger):**
                        *   Your responses MUST be as SHORT and CLEAR as possible. Brevity is key.
                        *   Relay the critical instructions from `emergency_details` immediately and precisely.
                        *   Example: "Okay, {client_name}, the instructions say: [critical instruction]. Please do that now."
                        *   If the instructions advise calling emergency services, state that clearly: "The instructions say to call emergency services at [phone number if provided, otherwise 'your local emergency number']. Please do so immediately."
                        *   After relaying critical emergency steps, if appropriate and you are not advising to call emergency services directly as the primary step, you may then call `info_or_emergency_conclude_call` or await further instruction from the user if they are still on the line and it's safe to continue.
                    *   **If the details are INFORMATIONAL or describe a NON-IMMEDIATE issue:**
                        *   Provide the information from `emergency_details` in a helpful and clear manner.
                        *   You can engage in a more natural conversation, answer follow-up questions, and provide clarification.
                        *   Example: "I have the information for you. It says: [details from function]. Does that help, or do you have more questions?"

                2.  **Guiding and Assisting**:
                    *   Listen to {client_name}\'s responses and questions carefully.
                    *   Provide assistance based on the information you have.
                    *   If you don\'t have the answer, be honest. You can say something like: "I don\'t have that specific information, but I can [suggest an alternative, e.g., note it down, suggest they contact support through another channel if appropriate after this call]."

                3.  **Concluding the Interaction**:
                    *   Once {client_name} confirms they have the information they need, or the emergency steps (that you can guide them through) are completed, or if they indicate they will take over (e.g., by calling emergency services as instructed), you MUST call the `info_or_emergency_conclude_call` function.
                    *   Do not say goodbye yourself; the function call will handle the call conclusion.

                Remember, the initial greeting has already been handled. Your conversation should pick up naturally. Absolutely do not greet the client again.
                The client\'s full name is {context.get_client().first_name} {context.get_client().last_name}.
                Current accommodation details: {accommodation}.
                Speak clearly and calmly, especially if it seems like an emergency. If it is an emergency, prioritize brevity and directness in your speech after obtaining details from the function.
                """
            }
        ],
        "functions": [get_emergency_details_schema, info_or_emergency_conclude_call_schema],
    }
    return flow_config

async def route_client_to_intent_handler(args: FlowArgs, flow_manager: FlowManager):
    intent = args.get("intent")
    logger.info(f"Routing client to intent: {intent}")
    if intent == "booking":
        await flow_manager.set_node("booking",  await create_booking_flow())
    elif intent == "settlement":
        # Pass flow_manager to create_settlement_flow as it needs to set state
        settlement_flow_config = await create_settlement_flow(flow_manager.state['context'])
        await flow_manager.set_node("settlement", settlement_flow_config)
    elif intent == "info-or-emergency":
        info_emergency_flow_config = await create_info_or_emergency_flow(flow_manager.state['context'])
        await flow_manager.set_node("info_or_emergency", info_emergency_flow_config)
    else:
        return {"status": "error", "message": f"Unknown intent: {intent}, please provide one of the following intents: booking, settlement, info-or-emergency"}
    flow_manager.state['context'].set_intent(intent)
    return {"status": "success", "intent": intent}

route_client_to_intent_schema = FlowsFunctionSchema(
    name="route_client_to_intent",
    description="Route client to intent handler. Client may have such intents: booking, settlement, info-or-emergency. Call this function only once you understand client's intent. After calling this function you should not handle clients intent, cause client is routed to the intent handler. Say: Let me proceed with this.",
    properties={"intent": {"type": "string"}},
    required=["intent"],
    handler=route_client_to_intent_handler,
)

async def create_booking_end_node(context: ConversationContext) -> NodeConfig:
    """Create the final node."""
    booking_details = await clients_controller_get_current_accommodation.asyncio(
        client=crm_client,
        id=context.get_client().id
    )

    return {
        "role_messages": [
            {
                "role": "system",
                "content": voice_instructions
            }
        ],
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

async def booking_end_quote_handler(args: FlowArgs, flow_manager: FlowManager):
    node = await create_booking_end_node(context=flow_manager.state['context'])
    await flow_manager.set_node("booking_end_quote", node)

booking_end_quote_schema = FlowsFunctionSchema(
    name="booking_end_quote",
    description="Ends the current process or conversation related to booking. Call this when the user indicates they are finished or the booking task is complete.",
    properties={},
    required=[],
    handler=booking_end_quote_handler,
)

def create_client_initial_flow(context: ConversationContext):
    flow_config = {
        "role_messages": [
            {
                "role": "system",
                "content": voice_instructions
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


# def save_wav(filename: str, audio_bytes: io.BytesIO, sample_rate: int, channels: int, sample_width: int = 2):
#     """Saves audio data from BytesIO to a WAV file."""
#     with wave.open(filename, 'wb') as wf:
#         wf.setnchannels(channels)
#         wf.setsampwidth(sample_width)  # Bytes per sample (e.g., 2 for 16-bit audio)
#         wf.setframerate(sample_rate)
#         wf.writeframes(audio_bytes.getvalue())
#     logger.info(f"Saved audio to {filename}")


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

    # tl = TranscriptionLogger() # We'll get transcript from LLM context

    llm = OpenAILLMService(api_key=os.getenv("OPENAI_API_KEY"))
 
    # This 'llm_context' is the OpenAILLMContext
    # It will store the conversation history.
    llm_context = OpenAILLMContext() # Renamed from 'context' for clarity
    context_aggregator = llm.create_context_aggregator(llm_context)
    
    tts = CartesiaTTSService(api_key=os.getenv("CARTESIA_API_KEY"), voice_id="5c42302c-194b-4d0c-ba1a-8cb485c84ab9", model="sonic-2")
    audiobuffer = AudioBufferProcessor()
    # --- Audio Recording Setup --- (Removed)
    # user_audio_recorder = AudioBufferProcessor(name="user_audio_recorder")
    # assistant_audio_recorder = AudioBufferProcessor(name="assistant_audio_recorder")

    # user_audio_buffer = io.BytesIO()
    # assistant_audio_buffer = io.BytesIO()

    # # Event handler for user audio
    # @user_audio_recorder.event_handler("on_audio_data")
    # async def on_user_audio_data(processor, audio_data, sample_rate, num_channels):
    #     logger.debug(f"User audio data received. Length: {len(audio_data)}, SR: {sample_rate}, Channels: {num_channels}")
    #     user_audio_buffer.write(audio_data)

    # # Event handler for assistant audio
    # @assistant_audio_recorder.event_handler("on_audio_data")
    # async def on_assistant_audio_data(processor, audio_data, sample_rate, num_channels):
    #     logger.debug(f"Assistant audio data received. Length: {len(audio_data)}, SR: {sample_rate}, Channels: {num_channels}")
    #     assistant_audio_buffer.write(audio_data)
    # --- End Audio Recording Setup ---

    pipeline = Pipeline([
        transport.input(),
        # user_audio_recorder,      # Removed
        stt,
        # tl, # Not using TranscriptionLogger for final transcript
        context_aggregator.user(),
        llm,
        tts,
        audiobuffer,
        transport.output(),
        context_aggregator.assistant()
    ])

    task = PipelineTask(pipeline, params=PipelineParams(
        audio_in_sample_rate=16000, 
        audio_out_sample_rate=16000,
        allow_interruptions=True
    ))
    
    flow_manager = FlowManager(
        task=task,
        llm=llm,
        context_aggregator=context_aggregator,
        tts=tts,
    )
    phone_number="+380991111112"
    @audiobuffer.event_handler("on_audio_data")
    async def on_audio_data(buffer, audio, sample_rate, num_channels):
        print(f"Audio data received. Length: {len(audio)}, SR: {sample_rate}, Channels: {num_channels}")
        file_id = await save_audio(audio, sample_rate, num_channels, "full")
        # Store the latest audio file ID in state
        flow_manager.state['audio_file_id'] = file_id



    flow_manager.state['context'] = ConversationContext(
        phone_number=phone_number,
    )
    await audiobuffer.start_recording()
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

    logger.info("Starting pipeline runner...")
    await runner.run(task)
    logger.info("Pipeline runner has finished.")

    await audiobuffer.stop_recording()
    # --- Save Conversation Data ---
    # Create a unique ID for this conversation session for filenames
    session_id = str(uuid4())

    # logger.debug(f"User audio buffer size before save: {user_audio_buffer.tell()}")
    # logger.debug(f"Assistant audio buffer size before save: {assistant_audio_buffer.tell()}")

    transcript_filename = f"conversation_transcript_{session_id}.txt"
    try:
        conversation_messages = []
        if hasattr(llm_context, 'messages') and isinstance(llm_context.messages, list):
            conversation_messages = llm_context.messages
        elif hasattr(llm_context, 'get_messages') and callable(llm_context.get_messages):
            conversation_messages = await llm_context.get_messages() # Assuming get_messages might be async
        
        with open(transcript_filename, "w", encoding="utf-8") as f:
            if not conversation_messages:
                f.write("No messages found in LLM context.\\n")
                logger.warning("No messages found in LLM context to save.")
            for msg in conversation_messages:
                role = getattr(msg, 'role', msg.get('role', 'unknown'))
                content = getattr(msg, 'content', msg.get('content', ''))
                f.write(f"{role}: {content}\\n") # Escape newline for the string literal
            logger.info(f"Saved transcript to {transcript_filename}")
    except Exception as e:
        logger.error(f"Error saving transcript: {e}")

    # Save User Audio (Removed)
    # user_audio_filename = f"user_audio_{session_id}.wav"
    # save_wav(user_audio_filename, user_audio_buffer, 
    #          sample_rate=task.params.audio_in_sample_rate, 
    #          channels=1)

    # # Save Assistant Audio (Removed)
    # assistant_audio_filename = f"assistant_audio_{session_id}.wav"
    # save_wav(assistant_audio_filename, assistant_audio_buffer, 
    #          sample_rate=task.params.audio_out_sample_rate, 
    #          channels=1)
    # --- End Save Conversation Data ---

    logger.info("Conversation transcript saving complete.")
    # Create and print CallCompletedEvent
    intent = flow_manager.state['context'].get_intent()
    client = flow_manager.state['context'].get_client()
    accommodation = flow_manager.state['context'].get_client_accommodation()
    filtered_transcript = [
        {"role": getattr(msg, "role", msg.get("role")), "text": getattr(msg, "content", msg.get("content"))}
        for msg in conversation_messages
        if getattr(msg, "role", msg.get("role")) in ("user", "assistant")
    ]
    audio_file_id = flow_manager.state.get('audio_file_id')
    event = CallCompletedEvent(
        intent,
        client.id if client else None,
        accommodation.id if accommodation else None,
        filtered_transcript,
        audio_file_id
    )
    print("CallCompletedEvent:", event.to_dict())


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