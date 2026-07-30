package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.CreateTicketRequest;
import com.itworx.supportdesk.dto.TicketResponse;
import com.itworx.supportdesk.model.Ticket.Ticket;
import com.itworx.supportdesk.model.Ticket.TicketNumberGenerator;
import com.itworx.supportdesk.model.Ticket.TicketPriority;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.order.Order;
import com.itworx.supportdesk.repository.OrderRepository;
import com.itworx.supportdesk.repository.TicketRepository;
import com.itworx.supportdesk.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
    /*
    As an agent, I want to open a ticket for a customer issue, so that it can be tracked to resolution.
     - Given a valid ticket payload, when I POST /
    api/tickets , then it is created with a unique ticketNumber and status OPEN
     . - Given an optional orderId , then the ticket is linked to
    that order. - Priority: MUST · Milestone: M1
     */

    public TicketResponse createTicket(CreateTicketRequest request) {
        User customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new EntityNotFoundException("Customer not found"));

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
        return new TicketResponse(
                request.getCustomerId(), title, description, priority, ticketNumber, request.getOrderId());
    }
}