package com.itworx.supportdesk.dto;

import com.itworx.supportdesk.model.User;
import java.util.UUID;

public record UserSummaryResponse(UUID id, String name, String email) {
    public static UserSummaryResponse from(User user) {
        return new UserSummaryResponse(user.getId(), user.getName(), user.getEmail());
    }
}