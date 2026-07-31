package com.itworx.supportdesk.repository;

import com.itworx.supportdesk.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    boolean existsBySkuIgnoreCase(String sku);

    Optional<Product> findBySkuIgnoreCase(String sku);

    // Used by B1 to check for a duplicate sku on update, excluding the product being edited.
    boolean existsBySkuIgnoreCaseAndIdNot(String sku, UUID id);

    // B2 - Browse & search products: q matches sku/name, category is an optional exact filter.
    // Backed by a Specification (see ProductSpecifications) built in the service layer;
    // this method is kept for simple, index-friendly category-only lookups (e.g. Epic H tools).
    Page<Product> findByCategoryIgnoreCase(String category, Pageable pageable);
}