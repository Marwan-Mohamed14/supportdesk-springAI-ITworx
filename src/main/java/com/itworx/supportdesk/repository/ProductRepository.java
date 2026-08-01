package com.itworx.supportdesk.repository;

import com.itworx.supportdesk.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    boolean existsBySkuIgnoreCase(String sku);

    Optional<Product> findBySkuIgnoreCase(String sku);

    @Query("SELECT p FROM Product p " +
            "WHERE (:q IS NULL OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))) " +
            "AND (:category IS NULL OR LOWER(p.category) = LOWER(:category))")
    Page<Product> search(@Param("q") String q, @Param("category") String category, Pageable pageable);
}
