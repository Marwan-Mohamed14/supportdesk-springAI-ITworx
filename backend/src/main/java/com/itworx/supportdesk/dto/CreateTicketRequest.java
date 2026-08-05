package com.itworx.supportdesk.dto;

import com.itworx.supportdesk.model.Ticket.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;
@Setter
@Getter
public class CreateTicketRequest {

    @NotNull
    private UUID customerId;

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    private TicketPriority priority;

    private UUID orderId;
}