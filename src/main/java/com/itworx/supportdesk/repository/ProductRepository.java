package com.itworx.supportdesk.repository;

import com.itworx.supportdesk.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

}