package com.itworx.supportdesk.repository;

import com.itworx.supportdesk.model.audit.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface AuditLogRepository extends JpaRepository<AuditLog, java.util.UUID> {

    // NOTE: no ORDER BY here on purpose - matches ProductRepository.search's
    // convention of leaving sort entirely to the Pageable (see AuditController,
    // which defaults it to createdAt desc). Mixing an explicit JPQL ORDER BY
    // with a sorted Pageable is redundant at best and provider-dependent at worst.
    @Query("SELECT a FROM AuditLog a " +
            "WHERE (:q IS NULL OR LOWER(a.target) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "       OR LOWER(a.actorLabel) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "       OR LOWER(a.detail) LIKE LOWER(CONCAT('%', :q, '%'))) " +
            "AND (:action IS NULL OR a.action = :action) " +
            "AND (:actor IS NULL OR LOWER(a.actorLabel) LIKE LOWER(CONCAT('%', :actor, '%'))) " +
            "AND (:from IS NULL OR a.createdAt >= :from) " +
            "AND (:to IS NULL OR a.createdAt <= :to)")
    Page<AuditLog> search(
            @Param("q") String q,
            @Param("action") String action,
            @Param("actor") String actor,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable
    );
}
