package com.itworx.supportdesk.dto;

import com.itworx.supportdesk.model.Ticket.Ticket;
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
    private UUID assignedAgentId;


    public TicketResponse(Ticket ticket) {
        this.customerId = ticket.getCustomer().getId();
        this.title = ticket.getTitle();
        this.orderId = ticket.getOrder() != null ? ticket.getOrder().getId() : null;
        this.priority = ticket.getPriority();
        this.description = ticket.getDescription();
        this.ticketNumber = ticket.getTicketNumber();
        this.assignedAgentId = ticket.getAssignedAgent() != null ? ticket.getAssignedAgent().getId() : null;
    }


}
