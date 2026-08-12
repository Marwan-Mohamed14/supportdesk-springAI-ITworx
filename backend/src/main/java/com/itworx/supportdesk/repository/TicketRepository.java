package com.itworx.supportdesk.repository;

import com.itworx.supportdesk.model.Ticket.Ticket;
import com.itworx.supportdesk.model.Ticket.TicketPriority;
import com.itworx.supportdesk.model.Ticket.TicketStatus;
import com.itworx.supportdesk.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    Page<Ticket> findByStatusAndPriority(TicketStatus status, TicketPriority priority, Pageable pageable);
    Page<Ticket> findByStatus(TicketStatus status, Pageable pageable);
    Page<Ticket> findByPriority(TicketPriority priority, Pageable pageable);

    // Used to find the least-loaded agent when auto-assigning a chat-escalated
    // ticket (see TicketService#createTicketFromChatAndAssign).
    long countByAssignedAgentAndStatusIn(User assignedAgent, List<TicketStatus> statuses);

    // Used by MetricsService (Epic L2) for real, database-backed operational numbers.
    long countByStatusNot(TicketStatus status);
    long countByStatus(TicketStatus status);
    List<Ticket> findByStatus(TicketStatus status);

}