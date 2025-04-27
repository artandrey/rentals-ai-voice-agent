#
# Copyright (c) 2024–2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

import asyncio
import sys
import os
import json
from typing import Tuple

from dotenv import load_dotenv
from loguru import logger
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
load_dotenv(override=True)

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
    messages = [
        {
            "role": "system",
            "content": "Your are hotel assistant and your goal is to provide information about the hotel and the services it offers.",
        },
    ]

    context = OpenAILLMContext(messages)
    context_aggregator = llm.create_context_aggregator(context)
    tts = CartesiaTTSService(api_key=os.getenv("CARTESIA_API_KEY"), voice_id="5c42302c-194b-4d0c-ba1a-8cb485c84ab9", model="sonic-2")

    pipeline = Pipeline([transport.input(), stt, context_aggregator.user(), llm, tts, transport.output(), context_aggregator.assistant()])

    task = PipelineTask(pipeline, params=PipelineParams(audio_in_sample_rate=16000, audio_out_sample_rate=16000,
        allow_interruptions=True))

    runner = PipelineRunner(handle_sigint=False if sys.platform == "win32" else True)

    await asyncio.gather(runner.run(task))


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