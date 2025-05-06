from pipecat_flows import Flow, FlowNode, FlowsFunctionSchema

# Define handler function for collecting user's name
async def collect_name_handler(context, params, **kwargs):
    # Store the collected name in the flow context
    context.update({"user_name": params.get("name", "")})
    return True

# Define a function with FlowsFunctionSchema
collect_name_schema = FlowsFunctionSchema(
    name="collect_name",
    description="Record user's name",
    properties={"name": {"type": "string"}},
    required=["name"],
    handler=collect_name_handler,
    transition_to="welcome_user"
)

# Define handler function for another step
async def confirm_booking_handler(context, params, **kwargs):
    # Store the booking confirmation in the flow context
    context.update({"booking_confirmed": params.get("confirmed", False)})
    if params.get("confirmed", False):
        return "booking_details"
    else:
        return "goodbye"

# Define another function schema
confirm_booking_schema = FlowsFunctionSchema(
    name="confirm_booking",
    description="Confirm if user wants to make a booking",
    properties={"confirmed": {"type": "boolean"}},
    required=["confirmed"],
    handler=confirm_booking_handler,
    transition_to=None  # The handler will determine the transition
)

# Define the flow configuration
flow_config = {
    "initial_node": "greeting",
    "nodes": {
        "greeting": {
            "role_messages": [
                {
                    "role": "system",
                    "content": "You are a helpful hotel assistant. Your responses will be converted to audio."
                }
            ],
            "task_messages": [
                {
                    "role": "system",
                    "content": "Start by greeting the user and asking for their name."
                }
            ],
            "functions": [collect_name_schema]
        },
        "welcome_user": {
            "role_messages": [
                {
                    "role": "system",
                    "content": "You are a helpful hotel assistant. Your responses will be converted to audio."
                }
            ],
            "task_messages": [
                {
                    "role": "system",
                    "content": "Welcome the user by name and ask if they would like to make a booking."
                }
            ],
            "functions": [confirm_booking_schema]
        },
        "booking_details": {
            "role_messages": [
                {
                    "role": "system",
                    "content": "You are a helpful hotel assistant. Your responses will be converted to audio."
                }
            ],
            "task_messages": [
                {
                    "role": "system",
                    "content": "Ask for details about the booking, like check-in date, number of nights, and room type."
                }
            ],
            # Additional function schemas would be defined here
        },
        "goodbye": {
            "role_messages": [
                {
                    "role": "system",
                    "content": "You are a helpful hotel assistant. Your responses will be converted to audio."
                }
            ],
            "task_messages": [
                {
                    "role": "system",
                    "content": "Thank the user for their time and end the conversation politely."
                }
            ],
            # This could be a terminal node without further transitions
        }
    }
}

# Flow definition
hotel_booking_flow = Flow(
    name="hotel_booking",
    config=flow_config
) 