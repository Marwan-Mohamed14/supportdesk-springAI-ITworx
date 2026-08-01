package com.itworx.supportdesk.controller;

import com.itworx.supportdesk.dto.ticket.AssignTicketRequest;
import com.itworx.supportdesk.dto.ticket.EscalateTicketRequest;
import com.itworx.supportdesk.dto.ticket.TicketResponse;
import com.itworx.supportdesk.model.Ticket.Ticket;
import com.itworx.supportdesk.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable("id") UUID id,
            @Valid @RequestBody AssignTicketRequest request) {

        Ticket ticket = ticketService.assignTicket(id, request.agentId());
        return ResponseEntity.ok(TicketResponse.from(ticket));
    }

    @PostMapping("/{id}/escalate")
    public ResponseEntity<TicketResponse> escalateTicket(
            @PathVariable("id") UUID id,
            @Valid @RequestBody EscalateTicketRequest request) {

        Ticket ticket = ticketService.escalateTicket(id, request.reason());
        return ResponseEntity.ok(TicketResponse.from(ticket));
    }
}
