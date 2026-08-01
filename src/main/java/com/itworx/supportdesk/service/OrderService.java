package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.order.CreateOrderItemRequest;
import com.itworx.supportdesk.dto.order.CreateOrderRequest;
import com.itworx.supportdesk.dto.order.OrderItemResponse;
import com.itworx.supportdesk.dto.order.OrderResponse;
import com.itworx.supportdesk.dto.order.UpdateOrderStatusRequest;
import com.itworx.supportdesk.entity.Product;
import com.itworx.supportdesk.exception.CustomerNotFoundException;
import com.itworx.supportdesk.exception.InsufficientStockException;
import com.itworx.supportdesk.exception.InvalidProductStateException;
import com.itworx.supportdesk.exception.ProductNotFoundException;
import com.itworx.supportdesk.model.OrderItem;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.order.Order;
import com.itworx.supportdesk.model.order.OrderStatus;
import com.itworx.supportdesk.repository.OrderRepository;
import com.itworx.supportdesk.repository.ProductRepository;
import com.itworx.supportdesk.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        return mapToOrderResponse(order);
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        User customer = userRepository.findById(request.userId())
                .orElseThrow(() -> new CustomerNotFoundException(request.userId()));

        Order order = new Order(generateOrderNumber(), customer);

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CreateOrderItemRequest itemRequest : request.items()) {
            Product product = productRepository.findById(itemRequest.productId())
                    .orElseThrow(() -> ProductNotFoundException.forId(itemRequest.productId()));

            if (!Boolean.TRUE.equals(product.getActive())) {
                throw new InvalidProductStateException("Product '" + product.getSku() + "' is not active");
            }
            if (product.getStock() < itemRequest.quantity()) {
                throw new InsufficientStockException(product.getSku(), itemRequest.quantity(), product.getStock());
            }

            product.setStock(product.getStock() - itemRequest.quantity());
            product.setTotalAssignedItems(product.getTotalAssignedItems() + itemRequest.quantity());
            productRepository.save(product);

            OrderItem item = new OrderItem(order, product, itemRequest.quantity(), product.getPrice());
            order.getItems().add(item);
            totalAmount = totalAmount.add(item.getLineTotal());
        }

        order.setTotalAmount(totalAmount);
        Order saved = orderRepository.save(order);

        return mapToOrderResponse(saved);
    }

    @Transactional
    public OrderResponse updateOrderStatus(UUID id, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        OrderStatus currentStatus = order.getStatus();
        OrderStatus newStatus = request.status();

        if (!isValidTransition(currentStatus, newStatus)) {
            throw new IllegalArgumentException("Invalid status transition from " + currentStatus + " to " + newStatus);
        }

        order.setStatus(newStatus);
        Order updatedOrder = orderRepository.save(order);
        return mapToOrderResponse(updatedOrder);
    }

    private boolean isValidTransition(OrderStatus current, OrderStatus next) {
        return switch (current) {
            case PLACED -> next == OrderStatus.PAID;
            case PAID -> next == OrderStatus.SHIPPED;
            case SHIPPED -> next == OrderStatus.DELIVERED;
            default -> false;
        };
    }

    private String generateOrderNumber() {
        String candidate;
        do {
            candidate = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (orderRepository.existsByOrderNumber(candidate));
        return candidate;
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(this::mapToOrderItemResponse)
                .toList();

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