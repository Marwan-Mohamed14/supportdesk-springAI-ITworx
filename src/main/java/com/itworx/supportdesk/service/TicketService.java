package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.ticket.CreateTicketRequest;
import com.itworx.supportdesk.dto.ticket.TicketResponse;
import com.itworx.supportdesk.exception.InvalidTicketStateException;
import com.itworx.supportdesk.exception.TicketNotFoundException;
import com.itworx.supportdesk.exception.UserNotFoundException;
import com.itworx.supportdesk.model.Ticket.Ticket;
import com.itworx.supportdesk.model.Ticket.TicketNumberGenerator;
import com.itworx.supportdesk.model.Ticket.TicketPriority;
import com.itworx.supportdesk.model.Ticket.TicketStatus;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.order.Order;
import com.itworx.supportdesk.repository.OrderRepository;
import com.itworx.supportdesk.repository.TicketRepository;
import com.itworx.supportdesk.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class TicketService {
    @Autowired
    UserRepository userRepository;
    @Autowired
    TicketNumberGenerator generator;
    @Autowired
    TicketRepository ticketRepository;

    @Autowired
    OrderRepository orderRepository;


    public TicketResponse createTicket(CreateTicketRequest request) {


        User customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new UserNotFoundException(request.getCustomerId()));

        TicketPriority priority = request.getPriority();
        String ticketNumber = generator.generate();
        String description = request.getDescription();
        String title = request.getTitle();
        Ticket ticket = new Ticket(ticketNumber, customer, priority);

        Order order = null;
        if (request.getOrderId() != null) {
            UUID orderId = request.getOrderId();
            order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        }
        ticket.setOrder(order);
        ticket.setTitle(title);
        ticket.setDescription(description);
        ticketRepository.save(ticket);
        return TicketResponse.from(ticket);
    }

    public Page<TicketResponse> listAndFilter(TicketStatus status, TicketPriority priority, Pageable pageable) {
        Page<Ticket> tickets;
        if (status != null && priority != null) {
            tickets = ticketRepository.findByStatusAndPriority(status, priority, pageable);
        } else if (status != null) {
            tickets = ticketRepository.findByStatus(status, pageable);
        } else if (priority != null) {
            tickets = ticketRepository.findByPriority(priority, pageable);
        } else {
            tickets = ticketRepository.findAll(pageable);
        }
        return tickets.map(TicketResponse::from);
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