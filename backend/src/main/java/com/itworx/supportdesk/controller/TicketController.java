package com.itworx.supportdesk.controller;

import com.itworx.supportdesk.dto.ticket.AssignTicketRequest;
import com.itworx.supportdesk.dto.ticket.EscalateTicketRequest;
import com.itworx.supportdesk.model.Ticket.Ticket;
import com.itworx.supportdesk.dto.CreateTicketRequest;
import com.itworx.supportdesk.dto.TicketResponse;
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
    public ResponseEntity<?> createTicket(@Valid @RequestBody CreateTicketRequest request) {
        TicketResponse ticketResponse = ticketService.createTicket(request);
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
    public ResponseEntity<com.itworx.supportdesk.dto.ticket.TicketResponse> assignTicket(
            @PathVariable("id") UUID id,
            @Valid @RequestBody AssignTicketRequest request) {

        Ticket ticket = ticketService.assignTicket(id, request.agentId());
        return ResponseEntity.ok(com.itworx.supportdesk.dto.ticket.TicketResponse.from(ticket));
    }

    @PostMapping("/{id}/escalate")
    public ResponseEntity<com.itworx.supportdesk.dto.ticket.TicketResponse> escalateTicket(
            @PathVariable("id") UUID id,
            @Valid @RequestBody EscalateTicketRequest request) {

        Ticket ticket = ticketService.escalateTicket(id, request.reason());
        return ResponseEntity.ok(com.itworx.supportdesk.dto.ticket.TicketResponse.from(ticket));
    }
}
