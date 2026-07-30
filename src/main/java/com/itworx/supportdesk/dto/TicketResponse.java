package com.itworx.supportdesk.dto;

import com.itworx.supportdesk.model.Ticket.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Setter
@Getter
public class TicketResponse {

        @NotNull
        private UUID customerId;

        @NotNull
        private String ticketNumber;
        @NotBlank
        private String title;

        @NotBlank
        private String description;

        private TicketPriority priority;

        private UUID orderId;
        public TicketResponse(UUID customerId,String title, String description,TicketPriority priority
                              ,String ticketNumber,UUID orderId)
        {
            this.customerId=customerId;
            this.description=description;
            this.title=title;
            this.priority=priority;
            this.orderId=orderId;
            this.ticketNumber =ticketNumber;

        }

}
