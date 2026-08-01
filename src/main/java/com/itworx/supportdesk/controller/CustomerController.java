package com.itworx.supportdesk.controller;

import com.itworx.supportdesk.dto.customer.CustomerCreateRequest;
import com.itworx.supportdesk.dto.customer.CustomerDetailResponse;
import com.itworx.supportdesk.dto.customer.CustomerResponse;
import com.itworx.supportdesk.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    // Story C1
    @PostMapping
    public ResponseEntity<CustomerResponse> createCustomer(@Valid @RequestBody CustomerCreateRequest request) {
        CustomerResponse created = customerService.createCustomer(request);
        return ResponseEntity
                .created(URI.create("/api/customers/" + created.id()))
                .body(created);
    }

    // Story C2
    @GetMapping("/{id}")
    public CustomerDetailResponse getCustomer(@PathVariable UUID id) {
        return customerService.getCustomerWithHistory(id);
    }
}
