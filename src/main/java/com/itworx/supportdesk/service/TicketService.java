package com.itworx.supportdesk.service;

import com.itworx.supportdesk.exception.InvalidTicketStateException;
import com.itworx.supportdesk.exception.TicketNotFoundException;
import com.itworx.supportdesk.exception.UserNotFoundException;
import com.itworx.supportdesk.model.Ticket.Ticket;
import com.itworx.supportdesk.model.Ticket.TicketStatus;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.repository.TicketRepository;
import com.itworx.supportdesk.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public TicketService(TicketRepository ticketRepository, UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Ticket assignTicket(UUID ticketId, UUID agentId) {
        Ticket ticket = getTicketOrThrow(ticketId);

        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new InvalidTicketStateException(
                    "Cannot assign ticket " + ticketId + ": ticket is CLOSED");
        }
        if (ticket.getStatus() == TicketStatus.ESCALATED) {
            throw new InvalidTicketStateException(
                    "Cannot assign ticket " + ticketId + ": ticket is ESCALATED");
        }

        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new UserNotFoundException(agentId));

        ticket.setAssignedAgent(agent);
        ticket.setStatus(TicketStatus.IN_PROGRESS);

        return ticketRepository.save(ticket);
    }

    @Transactional
    public Ticket escalateTicket(UUID ticketId, String reason) {
        Ticket ticket = getTicketOrThrow(ticketId);

        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new InvalidTicketStateException(
                    "Cannot escalate ticket " + ticketId + ": ticket is CLOSED");
        }

        ticket.setStatus(TicketStatus.ESCALATED);
        ticket.setEscalationReason(reason);
        ticket.setEscalatedAt(Instant.now());

        return ticketRepository.save(ticket);
    }

    private Ticket getTicketOrThrow(UUID ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));
    }
}
