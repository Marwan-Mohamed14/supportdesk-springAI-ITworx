package com.itworx.supportdesk.repository;

import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {

    List<UserRole> findByUserId(UUID userId);

    List<UserRole> findByRoleId(UUID roleId);

    Optional<UserRole> findByUserIdAndRoleId(UUID userId, UUID roleId);

    boolean existsByUserIdAndRoleId(UUID userId, UUID roleId);

    // Used to pick a support agent to auto-assign a chat-escalated ticket to
    // (see TicketService#createTicketFromChatAndAssign).
    @Query("select ur.user from UserRole ur where ur.role.name = :roleName")
    List<User> findUsersByRoleName(String roleName);
}
