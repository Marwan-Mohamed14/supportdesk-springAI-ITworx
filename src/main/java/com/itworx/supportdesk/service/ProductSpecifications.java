package com.itworx.supportdesk.service;

import com.itworx.supportdesk.entity.Product;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * Dynamic filters backing B2 - Browse & search products
 * (GET /api/products?q=...&category=...).
 */
public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    /**
     * Matches sku or name containing {@code q}, case-insensitive.
     */
    public static Specification<Product> skuOrNameContains(String q) {
        if (!StringUtils.hasText(q)) {
            return null;
        }
        String like = "%" + q.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("sku")), like),
                cb.like(cb.lower(root.get("name")), like)
        );
    }

    /**
     * Exact, case-insensitive category match.
     */
    public static Specification<Product> hasCategory(String category) {
        if (!StringUtils.hasText(category)) {
            return null;
        }
        return (root, query, cb) -> cb.equal(cb.lower(root.get("category")), category.trim().toLowerCase());
    }

    /**
     * Combines the optional filters, skipping any that are absent.
     * <p>
     * Deliberately avoids {@code Specification.where(null)} as a starting point:
     * with Specification now overloaded for both {@code Specification<T>} and
     * {@code PredicateSpecification<T>}, a bare {@code null} argument is ambiguous
     * at compile time.
     */
    public static Specification<Product> filter(String q, String category) {
        Specification<Product> qSpec = skuOrNameContains(q);
        Specification<Product> categorySpec = hasCategory(category);

        if (qSpec == null && categorySpec == null) {
            // Match everything; findAll(spec, pageable) needs a non-null Specification.
            return (root, query, cb) -> cb.conjunction();
        }
        if (qSpec == null) {
            return categorySpec;
        }
        if (categorySpec == null) {
            return qSpec;
        }
        return qSpec.and(categorySpec);
    }
}