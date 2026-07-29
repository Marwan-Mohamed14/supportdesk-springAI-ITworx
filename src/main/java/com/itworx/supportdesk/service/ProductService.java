package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.ProductCreateRequest;
import com.itworx.supportdesk.dto.ProductResponse;
import com.itworx.supportdesk.dto.ProductUpdateRequest;
import com.itworx.supportdesk.dto.StockUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Business operations for Epic B - Product Catalog.
 */
public interface ProductService {

    /** B1 - Create product. */
    ProductResponse create(ProductCreateRequest request);

    /** B2 - Browse & search products. */
    Page<ProductResponse> search(String q, String category, Pageable pageable);

    /** Fetch a single product, e.g. for order/ticket/tool lookups. */
    ProductResponse getById(UUID id);

    /** B3 - Update product. */
    ProductResponse update(UUID id, ProductUpdateRequest request);

    /** B4 - Manage stock & availability. */
    ProductResponse updateStock(UUID id, StockUpdateRequest request);
}