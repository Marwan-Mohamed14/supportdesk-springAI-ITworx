package com.itworx.supportdesk.security.dto;

import java.util.List;
import java.util.UUID;

public record LoginResponse(
        String token,
        UUID userId,
        String name,
        String email,
        List<String> roles
) {
}