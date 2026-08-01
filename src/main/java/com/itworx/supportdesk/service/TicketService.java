package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.CreateTicketRequest;
import com.itworx.supportdesk.dto.TicketResponse;
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

import java.util.List;
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
        System.out.println("Received customerId: [" + request.getCustomerId() + "]");

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
        return new TicketResponse(ticket);
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
        return tickets.map(TicketResponse::new);
    }
}