package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.order.OrderItemResponse;
import com.itworx.supportdesk.dto.order.OrderResponse;
import com.itworx.supportdesk.model.order.Order;
import com.itworx.supportdesk.model.order.OrderItem;
import com.itworx.supportdesk.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        return mapToOrderResponse(order);
    }

    private OrderResponse mapToOrderResponse(Order order) {
        // If order.getItems() gives an error, check your Order model for the exact getter name (e.g., getOrderItems())
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(this::mapToOrderItemResponse)
                .toList();

        // Convert Instant to LocalDateTime if order.getCreatedAt() returns an Instant
        LocalDateTime orderDate = order.getCreatedAt() != null
                ? LocalDateTime.ofInstant(order.getCreatedAt(), ZoneId.systemDefault())
                : null;

        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getStatus().name(),
                orderDate,
                order.getTotalAmount(),
                itemResponses
        );
    }

    private OrderItemResponse mapToOrderItemResponse(OrderItem item) {
        return new OrderItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getSku(),
                item.getProduct().getName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getLineTotal()
        );
    }
}