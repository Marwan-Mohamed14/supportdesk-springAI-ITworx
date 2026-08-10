package com.itworx.supportdesk.repository;

import com.itworx.supportdesk.model.refund.Refund;
import com.itworx.supportdesk.model.refund.RefundStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.UUID;

public interface RefundRepository extends JpaRepository<Refund, UUID> {

    boolean existsByRefundNumber(String refundNumber);

    @Query("SELECT r FROM Refund r " +
            "WHERE (:status IS NULL OR r.status = :status) " +
            "AND (:overLimitAmount IS NULL OR r.amount >= :overLimitAmount)")
    Page<Refund> search(
            @Param("status") RefundStatus status,
            @Param("overLimitAmount") BigDecimal overLimitAmount,
            Pageable pageable
    );
}
