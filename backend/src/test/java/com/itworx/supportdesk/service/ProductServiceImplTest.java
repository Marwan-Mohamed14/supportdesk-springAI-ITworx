package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.ProductCreateRequest;
import com.itworx.supportdesk.dto.ProductResponse;
import com.itworx.supportdesk.dto.ProductUpdateRequest;
import com.itworx.supportdesk.dto.StockUpdateRequest;
import com.itworx.supportdesk.entity.Product;
import com.itworx.supportdesk.exception.DuplicateSkuException;
import com.itworx.supportdesk.exception.ProductNotFoundException;
import com.itworx.supportdesk.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product product;

    @BeforeEach
    void setUp() {
        product = new Product("SKU-1", "Keyboard", BigDecimal.TEN, 10, "Electronics");
    }

    @Test
    void createSavesNewProduct() {
        ProductCreateRequest request = new ProductCreateRequest("SKU-1", "Keyboard", BigDecimal.TEN, "Electronics", 10);

        when(productRepository.existsBySkuIgnoreCase("SKU-1")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenReturn(product);

        ProductResponse response = productService.create(request);

        assertEquals("SKU-1", response.sku());
        assertEquals("Keyboard", response.name());
    }

    @Test
    void createRejectsDuplicateSku() {
        ProductCreateRequest request = new ProductCreateRequest("SKU-1", "Keyboard", BigDecimal.TEN, "Electronics", 10);

        when(productRepository.existsBySkuIgnoreCase("SKU-1")).thenReturn(true);

        assertThrows(DuplicateSkuException.class, () -> productService.create(request));
    }

    @Test
    void getByIdThrowsWhenProductMissing() {
        UUID id = UUID.randomUUID();
        when(productRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ProductNotFoundException.class, () -> productService.getById(id));
    }

    @Test
    void updateChangesNameAndPrice() {
        UUID id = UUID.randomUUID();
        ProductUpdateRequest request = new ProductUpdateRequest("Mechanical Keyboard", BigDecimal.valueOf(50), "Electronics");

        when(productRepository.findById(id)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        ProductResponse response = productService.update(id, request);

        assertEquals("Mechanical Keyboard", response.name());
        assertEquals(BigDecimal.valueOf(50), response.price());
    }

    @Test
    void updateStockSetsStockAndActive() {
        UUID id = UUID.randomUUID();
        StockUpdateRequest request = new StockUpdateRequest(0, false);

        when(productRepository.findById(id)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        ProductResponse response = productService.updateStock(id, request);

        assertEquals(0, response.stock());
        assertFalse(response.active());
    }
}
