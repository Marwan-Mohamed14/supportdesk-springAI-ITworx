package com.itworx.supportdesk.controller;

import com.itworx.supportdesk.dto.CreateTicketRequest;
import com.itworx.supportdesk.dto.TicketResponse;
import com.itworx.supportdesk.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
