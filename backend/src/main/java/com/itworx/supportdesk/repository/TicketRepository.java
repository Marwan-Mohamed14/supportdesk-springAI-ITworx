package com.itworx.supportdesk.repository;

import com.itworx.supportdesk.model.Ticket.Ticket;
import com.itworx.supportdesk.model.Ticket.TicketPriority;
import com.itworx.supportdesk.model.Ticket.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    Page<Ticket> findByStatusAndPriority(TicketStatus status, TicketPriority priority, Pageable pageable);
    Page<Ticket> findByStatus(TicketStatus status, Pageable pageable);
    Page<Ticket> findByPriority(TicketPriority priority, Pageable pageable);

    // Added for Epic L, story L2 (operational metrics) - purely additive,
    // doesn't touch any existing query method above.
    long countByStatusIn(List<TicketStatus> statuses);

    long countByStatusAndModifiedAtBetween(TicketStatus status, Instant start, Instant end);

    long countByPriority(TicketPriority priority);

    long countByEscalatedAtIsNotNull();

    List<Ticket> findByStatus(TicketStatus status);
}