package com.itworx.supportdesk.repository;

import com.itworx.supportdesk.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
    List<OrderItem> findByOrder_Id(UUID orderId);
    List<OrderItem> findByProduct_Id(UUID productId);

}
