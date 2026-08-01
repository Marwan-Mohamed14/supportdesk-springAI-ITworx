package com.itworx.supportdesk.controller;

import com.itworx.supportdesk.dto.PageResponse;
import com.itworx.supportdesk.dto.ProductCreateRequest;
import com.itworx.supportdesk.dto.ProductResponse;
import com.itworx.supportdesk.dto.ProductUpdateRequest;
import com.itworx.supportdesk.dto.StockUpdateRequest;
import com.itworx.supportdesk.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.SortDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.UUID;
@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService productService;
    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductCreateRequest request) {
        ProductResponse created = productService.create(request);
        return ResponseEntity
                .created(URI.create("/api/products/" + created.id()))
                .body(created);
    }

    @GetMapping
    public PageResponse<ProductResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @PageableDefault(size = 20)
            @SortDefault(sort = "name")
            Pageable pageable
    ) {
        Page<ProductResponse> page = productService.search(q, category, pageable);
        return PageResponse.from(page);
    }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable UUID id) {
        return productService.getById(id);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable UUID id, @Valid @RequestBody ProductUpdateRequest request) {
        return productService.update(id, request);
    }

    @PatchMapping("/{id}/stock")
    public ProductResponse updateStock(@PathVariable UUID id, @Valid @RequestBody StockUpdateRequest request) {
        return productService.updateStock(id, request);
    }
}