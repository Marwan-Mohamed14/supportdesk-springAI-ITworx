package com.itworx.supportdesk;

import com.itworx.supportdesk.dto.ProductCreateRequest;
import com.itworx.supportdesk.dto.StockUpdateRequest;
import com.itworx.supportdesk.entity.Product;
import com.itworx.supportdesk.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProductIntegrationTest extends IntegrationTestBase {

    @Autowired
    private ProductRepository productRepository;

    private ProductCreateRequest newProductRequest() {
        String sku = "TEST-SKU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return new ProductCreateRequest(sku, "Test Widget", BigDecimal.valueOf(19.99), "Testing", 25);
    }

    @Test
    void adminCanCreateProductAndItPersists() throws Exception {
        String token = loginAs(ADMIN_EMAIL);
        ProductCreateRequest request = newProductRequest();

        String response = mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sku").value(request.sku()))
                .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(objectMapper.readTree(response).get("id").asText());
        assertTrue(productRepository.findById(id).isPresent());
    }

    @Test
    void agentCannotCreateProduct() throws Exception {
        String token = loginAs(AGENT_EMAIL);

        mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newProductRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerCannotCreateProduct() throws Exception {
        String token = loginAs(CUSTOMER_EMAIL);

        mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newProductRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    void anyAuthenticatedRoleCanListProducts() throws Exception {
        String token = loginAs(CUSTOMER_EMAIL);

        mockMvc.perform(get("/api/products").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void adminUpdatingStockPersistsToTheDatabase() throws Exception {
        String token = loginAs(ADMIN_EMAIL);

        Product product = new Product("STOCK-TEST-" + UUID.randomUUID(), "Stock Test Widget", BigDecimal.TEN, 10, "Testing");
        product = productRepository.save(product);

        StockUpdateRequest request = new StockUpdateRequest(3, false);

        mockMvc.perform(patch("/api/products/{id}/stock", product.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(3))
                .andExpect(jsonPath("$.active").value(false));

        Product reloaded = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(3, reloaded.getStock());
        assertFalse(reloaded.getActive());
    }
}
