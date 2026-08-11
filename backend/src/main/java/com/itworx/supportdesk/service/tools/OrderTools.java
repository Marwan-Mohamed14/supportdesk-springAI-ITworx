package com.itworx.supportdesk.service.tools;

import com.itworx.supportdesk.model.OrderItem;
import com.itworx.supportdesk.model.order.Order;
import com.itworx.supportdesk.repository.OrderRepository;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Spring AI tool the chatbot can invoke to answer order-status questions
 * with real data (User Story H1).
 * <p>
 * Deliberately returns a plain, unambiguous "not found" string rather than
 * throwing — a thrown exception here would surface as a generic tool-call
 * failure to the model, which is exactly the situation H1's acceptance
 * criteria warns against ("the tool returns 'not found' and the assistant
 * relays that without inventing data"). Returning the string directly gives
 * the model something concrete and honest to relay.
 */
@Component
public class OrderTools {

    private final OrderRepository orderRepository;

    public OrderTools(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Tool(description = "Look up the current status, total amount and items of an order by its order number " +
            "(e.g. 'ORD-24817'). Use this whenever the user asks about a specific order's status, contents, or total. " +
            "Always call this tool rather than guessing — if it reports the order was not found, say so plainly.")
    public String getOrderStatus(
            @ToolParam(description = "The order number, e.g. ORD-24817") String orderNumber
    ) {
        if (orderNumber == null || orderNumber.isBlank()) {
            return "No order number was provided.";
        }

        return orderRepository.findByOrderNumber(orderNumber.trim())
                .map(this::describe)
                .orElse("No order found with order number '" + orderNumber.trim() + "'.");
    }

    private String describe(Order order) {
        List<OrderItem> items = order.getItems();
        String itemsSummary = items.isEmpty()
                ? "no items"
                : items.size() + " item(s): " + items.stream()
                        .map(i -> i.getProduct().getName() + " (x" + i.getQuantity() + ")")
                        .reduce((a, b) -> a + ", " + b)
                        .orElse("");

        return "Order " + order.getOrderNumber()
                + " is currently " + order.getStatus()
                + ". Total amount: " + order.getTotalAmount()
                + ". Contains " + itemsSummary + ".";
    }
}
