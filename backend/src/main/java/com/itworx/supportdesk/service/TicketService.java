package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.CreateTicketRequest;
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
import com.itworx.supportdesk.repository.UserRoleRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.time.Instant;

@Service
public class TicketService {
    // Statuses that count as "load" on an agent when picking who to
    // auto-assign a chat-escalated ticket to (see createTicketFromChatAndAssign).
    private static final List<TicketStatus> OPEN_STATUSES = List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS);

    @Autowired
    UserRepository userRepository;
    @Autowired
    UserRoleRepository userRoleRepository;
    @Autowired
    TicketNumberGenerator generator;
    @Autowired
    TicketRepository ticketRepository;

    @Autowired
    OrderRepository orderRepository;

    public TicketResponse createTicket(CreateTicketRequest request) {
        Ticket ticket = buildTicket(request);
        ticketRepository.save(ticket);
        return TicketResponse.from(ticket);
    }

    // Same as createTicket, but also picks the least-loaded AGENT (fewest
    // OPEN/IN_PROGRESS tickets) and assigns the new ticket to them in one
    // step - used when the chatbot escalates a conversation to a human
    // (see ChatWidget's "Connect me with an agent" button). If no AGENT
    // users exist, the ticket is saved unassigned/OPEN like a normal
    // manually-created ticket.
    @Transactional
    public TicketResponse createTicketFromChatAndAssign(CreateTicketRequest request) {
        Ticket ticket = buildTicket(request);

        List<User> agents = userRoleRepository.findUsersByRoleName("AGENT");
        User leastLoadedAgent = agents.stream()
                .min(Comparator.comparingLong(agent -> ticketRepository.countByAssignedAgentAndStatusIn(agent, OPEN_STATUSES)))
                .orElse(null);

        if (leastLoadedAgent != null) {
            ticket.setAssignedAgent(leastLoadedAgent);
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        ticketRepository.save(ticket);
        return TicketResponse.from(ticket);
    }

    private Ticket buildTicket(CreateTicketRequest request) {
        System.out.println("Received customerId: [" + request.getCustomerId() + "]");

        User customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new EntityNotFoundException("Customer not found"));

        TicketPriority priority = request.getPriority();
        String ticketNumber = generator.generate();
        Ticket ticket = new Ticket(ticketNumber, customer, priority);

        Order order = null;
        if (request.getOrderId() != null) {
            order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        }
        ticket.setOrder(order);
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        return ticket;
    }

    public Page<TicketResponse> ListAndFilter(TicketStatus status, TicketPriority priority, Pageable pageable) {
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