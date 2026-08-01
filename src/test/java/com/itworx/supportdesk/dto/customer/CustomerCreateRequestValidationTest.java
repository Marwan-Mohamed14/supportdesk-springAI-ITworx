package com.itworx.supportdesk.dto.customer;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class CustomerCreateRequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void closeFactory() {
        factory.close();
    }

    @Test
    void validRequest_hasNoViolations() {
        CustomerCreateRequest request = new CustomerCreateRequest("Nour Ali", "nour@example.com", "s3cret!23");
        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void blankPassword_isRejected() {
        CustomerCreateRequest request = new CustomerCreateRequest("Nour Ali", "nour@example.com", "");
        Set<ConstraintViolation<CustomerCreateRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("password"));
    }

    @Test
    void shortPassword_isRejected() {
        CustomerCreateRequest request = new CustomerCreateRequest("Nour Ali", "nour@example.com", "abc123");
        Set<ConstraintViolation<CustomerCreateRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("password"));
    }

    @Test
    void invalidEmail_isRejected() {
        CustomerCreateRequest request = new CustomerCreateRequest("Nour Ali", "not-an-email", "s3cret!23");
        Set<ConstraintViolation<CustomerCreateRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("email"));
    }
}
