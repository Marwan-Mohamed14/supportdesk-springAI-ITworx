package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.customer.CustomerCreateRequest;
import com.itworx.supportdesk.dto.customer.CustomerDetailResponse;
import com.itworx.supportdesk.dto.customer.CustomerResponse;
import com.itworx.supportdesk.exception.DuplicateResourceException;
import com.itworx.supportdesk.exception.ResourceNotFoundException;
import com.itworx.supportdesk.model.Ticket.Ticket;
import com.itworx.supportdesk.model.Ticket.TicketPriority;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.order.Order;
import com.itworx.supportdesk.repository.OrderRepository;
import com.itworx.supportdesk.repository.TicketRepository;
import com.itworx.supportdesk.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private TicketRepository ticketRepository;

    private CustomerService customerService;

    @BeforeEach
    void setUp() {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        customerService = new CustomerService(userRepository, orderRepository, ticketRepository, passwordEncoder);
    }

    @Test
    void createCustomer_withUniqueEmail_isStoredAndReturned() {
        CustomerCreateRequest request = new CustomerCreateRequest("Nour Ali", "nour@example.com", "s3cret!23");
        when(userRepository.existsByEmail("nour@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        CustomerResponse response = customerService.createCustomer(request);

        assertThat(response.id()).isNotNull();
        assertThat(response.name()).isEqualTo("Nour Ali");
        assertThat(response.email()).isEqualTo("nour@example.com");
    }

    @Test
    void createCustomer_withDuplicateEmail_throwsConflict() {
        CustomerCreateRequest request = new CustomerCreateRequest("Nour Ali", "nour@example.com", "s3cret!23");
        when(userRepository.existsByEmail("nour@example.com")).thenReturn(true);

        assertThatThrownBy(() -> customerService.createCustomer(request))
                .isInstanceOf(DuplicateResourceException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void getCustomerWithHistory_includesOrdersAndTickets() {
        UUID customerId = UUID.randomUUID();
        User customer = new User("Nour Ali", "nour@example.com", "hashed");
        customer.setId(customerId);
        customer.setCreatedAt(Instant.now());
        customer.setModifiedAt(Instant.now());

        Order order = new Order("ORD-1001", customer);
        order.setId(UUID.randomUUID());
        order.setTotalAmount(new BigDecimal("49.99"));
        order.setCreatedAt(Instant.now());

        Ticket ticket = new Ticket("TCK-2001", customer, TicketPriority.HIGH);
        ticket.setId(UUID.randomUUID());
        ticket.setCreatedAt(Instant.now());

        when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)).thenReturn(List.of(order));
        when(ticketRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)).thenReturn(List.of(ticket));

        CustomerDetailResponse response = customerService.getCustomerWithHistory(customerId);

        assertThat(response.id()).isEqualTo(customerId);
        assertThat(response.orders()).hasSize(1);
        assertThat(response.orders().get(0).orderNumber()).isEqualTo("ORD-1001");
        assertThat(response.tickets()).hasSize(1);
        assertThat(response.tickets().get(0).ticketNumber()).isEqualTo("TCK-2001");
    }

    @Test
    void getCustomerWithHistory_unknownId_throwsNotFound() {
        UUID missingId = UUID.randomUUID();
        when(userRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customerService.getCustomerWithHistory(missingId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
