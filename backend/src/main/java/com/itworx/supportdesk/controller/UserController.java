package com.itworx.supportdesk.controller;

import com.itworx.supportdesk.dto.UserSummaryResponse;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.repository.UserRoleRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Stream;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserRoleRepository userRoleRepository;

    public UserController(UserRoleRepository userRoleRepository) {
        this.userRoleRepository = userRoleRepository;
    }

    @GetMapping
    public List<UserSummaryResponse> listUsers() {
        List<User> agents = userRoleRepository.findUsersByRoleName("AGENT");
        List<User> admins = userRoleRepository.findUsersByRoleName("ADMIN");

        return Stream.concat(agents.stream(), admins.stream())
                .distinct()
                .map(UserSummaryResponse::from)
                .toList();
    }
}
