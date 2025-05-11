import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

import { CallCompletedHandler } from '../../application/handlers/call-completed.handler';

@Processor('call-completed')
@Injectable()
export class CallCompletedProcessor extends WorkerHost {
  constructor(private readonly handler: CallCompletedHandler) {
    super();
  }

  async process(job: Job): Promise<void> {
    await this.handler.handle(job.data);
  }
}
