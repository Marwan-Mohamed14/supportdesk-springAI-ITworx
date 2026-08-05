package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.ProductCreateRequest;
import com.itworx.supportdesk.dto.ProductResponse;
import com.itworx.supportdesk.dto.ProductUpdateRequest;
import com.itworx.supportdesk.dto.StockUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProductService {

        ProductResponse create(ProductCreateRequest request);

        Page<ProductResponse> search(String q, String category, Pageable pageable);

        ProductResponse getById(UUID id);

        ProductResponse update(UUID id, ProductUpdateRequest request);

        ProductResponse updateStock(UUID id, StockUpdateRequest request);
}