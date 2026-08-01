package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.customer.CustomerCreateRequest;
import com.itworx.supportdesk.dto.customer.CustomerDetailResponse;
import com.itworx.supportdesk.dto.customer.CustomerResponse;
import com.itworx.supportdesk.dto.customer.OrderSummary;
import com.itworx.supportdesk.dto.customer.TicketSummary;
import com.itworx.supportdesk.exception.DuplicateResourceException;
import com.itworx.supportdesk.exception.ResourceNotFoundException;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.repository.OrderRepository;
import com.itworx.supportdesk.repository.TicketRepository;
import com.itworx.supportdesk.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CustomerService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final TicketRepository ticketRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerService(UserRepository userRepository,
                            OrderRepository orderRepository,
                            TicketRepository ticketRepository,
                            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.ticketRepository = ticketRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Story C1: register a customer. Fails with a 409-mapped exception on a
     * duplicate email.
     */
    @Transactional
    public CustomerResponse createCustomer(CustomerCreateRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException(
                    "A customer with email '" + request.email() + "' already exists");
        }

        User customer = new User(request.name(), request.email(), passwordEncoder.encode(request.password()));
        User saved = userRepository.save(customer);
        return CustomerResponse.from(saved);
    }

    /**
     * Story C2: fetch a customer along with their order and ticket history.
     */
    @Transactional(readOnly = true)
    public CustomerDetailResponse getCustomerWithHistory(UUID customerId) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer " + customerId + " not found"));

        List<OrderSummary> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(OrderSummary::from)
                .toList();

        List<TicketSummary> tickets = ticketRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(TicketSummary::from)
                .toList();

        return new CustomerDetailResponse(
                customer.getId(),
                customer.getName(),
                customer.getEmail(),
                customer.getCreatedAt(),
                customer.getModifiedAt(),
                orders,
                tickets
        );
    }
}
