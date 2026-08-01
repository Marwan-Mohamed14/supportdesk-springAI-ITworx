package com.itworx.supportdesk.entity;

import com.itworx.supportdesk.model.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "products")
@Check(constraints = "price >= 0 AND stock >= 0 AND " +
        "total_units = stock + total_assigned_items + total_decommissioned")
public class Product {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @NotBlank
    @Column(nullable = false, unique = true, length = 64)
    private String sku;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String name;

    @NotNull
    @Min(0)
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(length = 100)
    private String category;

    @NotNull
    @Column(nullable = false)
    private Boolean active = true;

    @NotNull
    @Min(0)
    @Column(nullable = false)
    private Integer stock;

    @NotNull
    @Min(0)
    @Column(name = "total_assigned_items", nullable = false)
    private Integer totalAssignedItems = 0;

    @NotNull
    @Min(0)
    @Column(name = "total_decommissioned", nullable = false)
    private Integer totalDecommissioned = 0;

    @NotNull
    @Min(0)
    @Column(name = "total_units", nullable = false)
    private Integer totalUnits;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modified_by")
    private User modifiedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "modified_at", nullable = false)
    private Instant modifiedAt;

    protected Product() {
    }

    public Product(String sku, String name, BigDecimal price, Integer totalUnits, String category) {
        this.sku = sku;
        this.name = name;
        this.price = price;
        this.totalUnits = totalUnits;
        this.stock = totalUnits;
        this.category = category;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.modifiedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.modifiedAt = Instant.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Product product)) return false;
        return id != null && id.equals(product.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Product{id=" + id + ", sku='" + sku + "', name='" + name + "'}";
    }
}