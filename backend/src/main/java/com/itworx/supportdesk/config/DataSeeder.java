package com.itworx.supportdesk.config;

import com.itworx.supportdesk.model.Role;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.UserRole;
import com.itworx.supportdesk.repository.RoleRepository;
import com.itworx.supportdesk.repository.UserRepository;
import com.itworx.supportdesk.repository.UserRoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Runs once on startup. Makes sure the RBAC catalog (roles table) and a single
 * bootstrap admin account exist, since there is no admin panel yet to create
 * either by hand and the "users"/"user_roles" tables start out empty.
 *
 * Every step is idempotent (checked with existsBy... first), so this is safe
 * to run on every application start without creating duplicates.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final List<String> DEFAULT_ROLES = List.of("ADMIN", "AGENT", "CUSTOMER");

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    private final String bootstrapAdminName;
    private final String bootstrapAdminEmail;
    private final String bootstrapAdminPassword;

    public DataSeeder(
            RoleRepository roleRepository,
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap-admin.name:System Admin}") String bootstrapAdminName,
            @Value("${app.bootstrap-admin.email:admin@itworx.com}") String bootstrapAdminEmail,
            @Value("${app.bootstrap-admin.password:Admin@12345}") String bootstrapAdminPassword
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.bootstrapAdminName = bootstrapAdminName;
        this.bootstrapAdminEmail = bootstrapAdminEmail;
        this.bootstrapAdminPassword = bootstrapAdminPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        DEFAULT_ROLES.forEach(this::ensureRoleExists);
        ensureBootstrapAdminExists();
    }

    private void ensureRoleExists(String roleName) {
        if (!roleRepository.existsByName(roleName)) {
            roleRepository.save(new Role(roleName));
            log.info("Seeded role '{}'", roleName);
        }
    }

    private void ensureBootstrapAdminExists() {
        if (userRepository.existsByEmail(bootstrapAdminEmail)) {
            return;
        }

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("ADMIN role must be seeded before the bootstrap admin"));

        User admin = new User(bootstrapAdminName, bootstrapAdminEmail, passwordEncoder.encode(bootstrapAdminPassword));
        admin = userRepository.save(admin);

        userRoleRepository.save(new UserRole(admin, adminRole));

        log.warn("Seeded bootstrap admin '{}' with the configured default password - " +
                "change it (or override app.bootstrap-admin.* / BOOTSTRAP_ADMIN_* env vars) before any shared/deployed use.",
                bootstrapAdminEmail);
    }
}
