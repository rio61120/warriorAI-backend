import { Module } from "@nestjs/common";

import { AiModule } from "@app/modules/ai/ai.module";

import { TicketController } from "./ticket.controller";
import { TicketService } from "./ticket.service";
import { AiService } from "@app/modules/ai/ai.service";

@Module({
  imports: [AiModule],
  controllers: [TicketController],
  providers: [TicketService, AiService],
})
export class TicketModule {}
