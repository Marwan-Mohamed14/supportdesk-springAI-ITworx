package com.itworx.supportdesk.dto.customer;

import com.itworx.supportdesk.model.User;

import java.time.Instant;
import java.util.UUID;

public record CustomerResponse(
        UUID id,
        String name,
        String email,
        Instant createdAt,
        Instant modifiedAt
) {
    public static CustomerResponse from(User user) {
        return new CustomerResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCreatedAt(),
                user.getModifiedAt()
        );
    }
}
