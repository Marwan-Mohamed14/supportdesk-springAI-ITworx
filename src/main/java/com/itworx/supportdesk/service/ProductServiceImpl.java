package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.ProductCreateRequest;
import com.itworx.supportdesk.dto.ProductResponse;
import com.itworx.supportdesk.dto.ProductUpdateRequest;
import com.itworx.supportdesk.dto.StockUpdateRequest;
import com.itworx.supportdesk.entity.Product;
import com.itworx.supportdesk.exception.DuplicateSkuException;
import com.itworx.supportdesk.exception.ProductNotFoundException;
import com.itworx.supportdesk.repository.ProductRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    public ProductServiceImpl(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public ProductResponse create(ProductCreateRequest request) {
        if (productRepository.existsBySkuIgnoreCase(request.sku())) {
            throw new DuplicateSkuException(request.sku());
        }

        Product product = new Product(
                request.sku(),
                request.name(),
                request.price(),
                request.stock(),
                request.category()
        );

        try {
            Product saved = productRepository.save(product);
            return ProductResponse.from(saved);
        } catch (DataIntegrityViolationException ex) {
            // Guards against a race where two requests pass the existsBySku check
            // for the same sku before either commits.
            throw new DuplicateSkuException(request.sku());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> search(String q, String category, Pageable pageable) {
        return productRepository
                .findAll(ProductSpecifications.filter(q, category), pageable)
                .map(ProductResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getById(UUID id) {
        return ProductResponse.from(findProductOrThrow(id));
    }

    @Override
    public ProductResponse update(UUID id, ProductUpdateRequest request) {
        Product product = findProductOrThrow(id);

        product.setName(request.name());
        product.setPrice(request.price());
        product.setCategory(request.category());

        Product saved = productRepository.save(product);
        return ProductResponse.from(saved);
    }

    @Override
    public ProductResponse updateStock(UUID id, StockUpdateRequest request) {
        Product product = findProductOrThrow(id);

        // total_units must stay consistent with the DB check constraint
        // (total_units = stock + total_assigned_items + total_decommissioned).
        int newTotalUnits = request.stock() + product.getTotalAssignedItems() + product.getTotalDecommissioned();

        product.setStock(request.stock());
        product.setActive(request.active());
        product.setTotalUnits(newTotalUnits);

        Product saved = productRepository.save(product);
        return ProductResponse.from(saved);
    }

    private Product findProductOrThrow(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> ProductNotFoundException.forId(id));
    }
}