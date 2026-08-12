package com.itworx.supportdesk.repository;

import com.itworx.supportdesk.entity.AuditLogEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLogEntry, UUID> {

    List<AuditLogEntry> findAllByOrderByCreatedAtDesc();

    boolean existsBySeedKey(String seedKey);
}
