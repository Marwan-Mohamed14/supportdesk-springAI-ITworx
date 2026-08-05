package com.itworx.supportdesk.security;

import com.itworx.supportdesk.model.Role;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.UserRole;
import com.itworx.supportdesk.repository.RoleRepository;
import com.itworx.supportdesk.repository.UserRepository;
import com.itworx.supportdesk.repository.UserRoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DevDataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    public DevDataSeeder(RoleRepository roleRepository, UserRepository userRepository,
                         UserRoleRepository userRoleRepository, PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (roleRepository.count() > 0) return; // already seeded, don't duplicate

        Role adminRole = roleRepository.save(new Role("ADMIN"));
        Role agentRole = roleRepository.save(new Role("AGENT"));

        User admin = new User("Karim Admin", "admin@supportdesk.com", passwordEncoder.encode("Admin123!"));
        userRepository.save(admin);
        userRoleRepository.save(new UserRole(admin, adminRole));

        User agent = new User("Sara Agent", "agent@supportdesk.com", passwordEncoder.encode("Agent123!"));
        userRepository.save(agent);
        userRoleRepository.save(new UserRole(agent, agentRole));
    }
}