package com.itworx.supportdesk.exception;

import java.util.UUID;

public class ProductNotFoundException extends RuntimeException {

    public ProductNotFoundException(UUID id) {
        super("Product not found: " + id);
    }

    public ProductNotFoundException(String message) {
        super(message);
    }

    public static ProductNotFoundException forId(UUID id) {
        return new ProductNotFoundException(id);
    }

    public static ProductNotFoundException forSku(String sku) {
        return new ProductNotFoundException("Product not found for sku: " + sku);
    }
}