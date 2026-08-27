import { Module } from "@nestjs/common";

import { AiModule } from "@app/modules/ai/ai.module";

import { TicketController } from "./ticket.controller";
import { TicketService } from "./ticket.service";

@Module({
  imports: [AiModule],
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}
