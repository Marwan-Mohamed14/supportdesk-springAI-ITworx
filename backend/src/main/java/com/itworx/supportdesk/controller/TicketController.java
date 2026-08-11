package com.itworx.supportdesk.controller;

import com.itworx.supportdesk.dto.ticket.AssignTicketRequest;
import com.itworx.supportdesk.dto.ticket.EscalateTicketRequest;
import com.itworx.supportdesk.dto.ticket.TicketResponse;
import com.itworx.supportdesk.model.Ticket.Ticket;
import com.itworx.supportdesk.dto.CreateTicketRequest;
import com.itworx.supportdesk.model.Ticket.TicketPriority;
import com.itworx.supportdesk.model.Ticket.TicketStatus;
import com.itworx.supportdesk.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/tickets")
public class TicketController {
    @Autowired
    TicketService ticketService;

    @PostMapping("/create")
    public ResponseEntity<TicketResponse> createTicket(@Valid @RequestBody CreateTicketRequest request) {
        TicketResponse ticketResponse = ticketService.createTicket(request);
        return ResponseEntity.status(201).body(ticketResponse);

    }

    // Used by the chatbot's "Connect me with an agent" button (ChatWidget.jsx)
    // to turn the conversation into a ticket and hand it straight to whichever
    // agent currently has the fewest open tickets - no separate assign step.
    @PostMapping("/create-and-assign")
    public ResponseEntity<TicketResponse> createAndAssign(@Valid @RequestBody CreateTicketRequest request) {
        TicketResponse ticketResponse = ticketService.createTicketFromChatAndAssign(request);
        return ResponseEntity.status(201).body(ticketResponse);
    }

    @GetMapping
    public Page<TicketResponse> ListTickets(
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) TicketStatus status,
            Pageable pageable) {
        return ticketService.ListAndFilter(status, priority, pageable);
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
