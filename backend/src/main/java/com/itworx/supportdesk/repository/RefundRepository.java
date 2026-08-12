package com.itworx.supportdesk.repository;

import com.itworx.supportdesk.entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RefundRepository extends JpaRepository<Refund, UUID> {

    boolean existsByCode(String code);

    List<Refund> findAllByOrderByRequestedAtDesc();
}
