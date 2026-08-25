import { Body, Controller, Post } from "@nestjs/common";

import { TicketService } from "@app/api/ticket/ticket.service";
import { ClassifyTicketRequestDto } from "@app/api/ticket/dto/ticket.dto";

@Controller("ticket")
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post("classify")
  classify(@Body() request: ClassifyTicketRequestDto) {
    return this.ticketService.classify(request.message);
  }
}
