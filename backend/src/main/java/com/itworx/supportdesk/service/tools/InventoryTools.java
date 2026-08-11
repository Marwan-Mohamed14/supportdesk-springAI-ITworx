package com.itworx.supportdesk.service.tools;

import com.itworx.supportdesk.entity.Product;
import com.itworx.supportdesk.repository.ProductRepository;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

/**
 * Spring AI tool the chatbot can invoke to answer stock/availability
 * questions with real data (User Story H2).
 */
@Component
public class InventoryTools {

    private final ProductRepository productRepository;

    public InventoryTools(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Tool(description = "Check the current stock quantity, active status and price of a product by its SKU. " +
            "Use this whenever the user asks whether an item is in stock, how many are left, or its current price. " +
            "Always call this tool rather than guessing — if it reports the SKU was not found, say so plainly.")
    public String checkInventory(
            @ToolParam(description = "The product SKU, e.g. 'DELL-LAT5550'") String sku
    ) {
        if (sku == null || sku.isBlank()) {
            return "No SKU was provided.";
        }

        return productRepository.findBySkuIgnoreCase(sku.trim())
                .map(this::describe)
                .orElse("No product found with SKU '" + sku.trim() + "'.");
    }

    private String describe(Product product) {
        if (!Boolean.TRUE.equals(product.getActive())) {
            return "Product '" + product.getName() + "' (SKU " + product.getSku() + ") is currently inactive and cannot be ordered.";
        }
        if (product.getStock() == null || product.getStock() <= 0) {
            return "Product '" + product.getName() + "' (SKU " + product.getSku() + ") is out of stock.";
        }
        return "Product '" + product.getName() + "' (SKU " + product.getSku() + ") has "
                + product.getStock() + " unit(s) in stock, priced at " + product.getPrice() + ".";
    }
}
