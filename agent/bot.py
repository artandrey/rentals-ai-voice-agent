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
from crm_api_client.crm_manager_client.api.rentals import rentals_controller_get_rentals, rentals_controller_get_rental_by_id, rentals_controller_get_rental_available_date_spans, rentals_controller_get_rental_emergency_details, rentals_controller_get_rental_settlement_details
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
from crm_api_client.crm_manager_client.models.date_day_dto import DateDayDto
load_dotenv(override=True)

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


async def confirm_settlement_handler(args: FlowArgs, flow_manager: FlowManager):
    accommodation_id = args.get("accommodation_id")
    response = await accommodations_controller_confirm_settlement.asyncio_detailed(
        client=crm_client,
        id=accommodation_id
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
    return {"status": "success", "accommodation_id": accommodation_id}

confirm_settlement_schema = FlowsFunctionSchema(
    name="confirm_settlement",
    description="Confirm settlement of the accommodation.",
    properties={"accommodation_id": {"type": "string", "description": "The ID of the accommodation to confirm settlement for."}},
    handler=confirm_settlement_handler,
    required=[]
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
    client_name = context.get_client().first_name if context.get_client() else "valued customer"
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
                "content": f"Great news, {client_name}! Your settlement has been successfully confirmed. We hope you have a wonderful stay at AI Rentals. If you need anything else, feel free to reach out. Goodbye!"
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
                You are to embody the persona of a friendly, patient, and very helpful property owner guiding them remotely, step-by-step. Think of this as a casual, helpful phone call where you're making sure they get in smoothly and without any fuss.

                Your first action is to call the \`get_settlement_details\` function. This function will provide you with the specific, ordered, step-by-step instructions for the settlement process. These instructions are your guide to help the user get inside the property.

                Once you have received the settlement instructions from the function:

                1.  **Getting Started - Location and First Step**:
                    *   Your very first question to {context.get_client().first_name} is to confirm their current location to ensure they are at or very near the property and to smoothly begin the guidance. Phrasing should be friendly and task-focused, for example: "Hi {context.get_client().first_name}, it's AI Rentals here. To help you get settled in, could you start by telling me where you are right now in relation to the property?" or "Hello {context.get_client().first_name}, hope you found it okay! Are you at the property now? Just let me know your current spot so we can begin."
                    *   Once they confirm their location (e.g., "Yes, I'm right outside the main door," or "I'm at 123 Main St."), respond with natural acknowledgement (e.g., "Okay, perfect!" or "Great, glad you made it there!") and then seamlessly give them the *very first* instruction from the \`get_settlement_details\`. For instance: "Right then, the first thing we'll do is [describe first step from details, e.g., 'look for the blue door on your left']. Can you see that from where you are?" or "Excellent. So, from where you are, the first step will be to [describe first step]. Let me know what you see or when you've done that."

                2.  **Guiding Through Subsequent Steps - The Conversational Loop**:
                    *   For each step *after the first one* from \`get_settlement_details\`:
                        *   Wait for {context.get_client().first_name} to indicate they've completed the previous action or are ready for the next.
                        *   Then, provide the next instruction. Frame your responses like a natural, flowing conversation:
                            *   Start with encouraging, varied, and natural-sounding feedback: "Excellent!", "Sounds good, you're doing great!", "Perfect, you've got it!", "Alright, nice one! What's next is...", "Okay, brilliant!"
                            *   Follow with the next clear instruction, focusing on one main action. It doesn't have to be a very short sentence if a bit more detail helps, but it should be easy to follow. For example: "Okay, great! So, the next thing you'll want to do is look for the intercom, which should be on the left side of the door. The code to use is zero-four-five. Give that a try."
                                or "Perfect! Now that you're at the elevator, go ahead and press the button for the 5th floor. Just give me a shout when the doors open up there."

                3.  **Checking In (Natural Confirmation Prompts)**:
                    *   After giving an instruction, check if they're with you or have completed it, but vary your phrasing to sound genuinely engaged and not like a robot. Examples: "How are you getting on with that?", "Were you able to find that okay, or do you need a bit more detail?", "Let me know when you're all set with that part.", "Just tell me when you've managed that, and we can move to the next bit.", "All good with that step then?"

                4.  **Language and Tone - Keep it Human and Engaging**:
                    *   **Natural Language**: Use conversational connectors like "Okay, so...", "Alright, then...", "Right...", "Well, next up...". Your sentences should be clear for a voice call, but prioritize a natural, friendly flow over extreme brevity. The aim is a helpful, human-sounding conversation.
                    *   **Warm and Patient Persona**: Maintain a consistently warm, patient, and encouraging tone. Sound like you are genuinely there to help them, step by step. Refer to the general <voice_instructions> for more on embodying a natural conversational style.

                5.  **Handling Difficulties Gracefully**:
                    *   If {context.get_client().first_name} mentions they're having trouble or seem unsure, respond with patience and understanding. For example: "No worries at all! Let's try that again. So, what you're looking for is [repeat/rephrase instruction clearly, perhaps adding a small helpful detail if implied by the original instructions]." or "Okay, let's work through that. Can you describe what you're seeing there? That might help me guide you better." Stick to the information provided in \`get_settlement_details\` – don't invent new details not present in the source instructions.

                6.  **Completing the Steps**: Continue this natural, step-by-step guidance until all instructions from \`get_settlement_details\` have been completed, and {context.get_client().first_name} is successfully inside the property.

                7.  **Final Confirmation and Function Call**: After {context.get_client().first_name} confirms completion of the *final* step (meaning they should now be inside), offer a final positive remark and confirm everything is okay. For example: "Fantastic, sounds like you're all in! Is everything looking good inside the apartment?" or "Excellent, so glad we got you settled in! Everything alright there for you?" Once they give a clear positive confirmation, you MUST immediately call the \`mark_user_get_inside\` function to conclude the settlement process. Your last verbal interaction before that function call is this confirmation of their success and well-being inside.

                Remember, the initial greeting has already been handled. Your conversation should pick up naturally from where the previous flow left off, focusing directly on the settlement task. Absolutely do not greet the client again.
                The client\'s full name is {context.get_client().first_name} {context.get_client().last_name}.
                """
            }   
        ],
        "functions": [get_settlement_details_schema, settlement_success_conclude_call_schema],
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
    # Add other intents here like "info-or-emergency"
    # else:
    #     # Fallback or error handling if intent is not recognized
    #     # For now, just return success without routing if intent is unknown
    #     logger.warning(f"Unknown intent: {intent}. No specific flow to route to.")
    #     return {"status": "success", "intent": intent, "message": "Intent not fully handled."}

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