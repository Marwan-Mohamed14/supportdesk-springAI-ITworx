package com.itworx.supportdesk;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itworx.supportdesk.model.Role;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.UserRole;
import com.itworx.supportdesk.repository.RoleRepository;
import com.itworx.supportdesk.repository.UserRepository;
import com.itworx.supportdesk.repository.UserRoleRepository;
import com.itworx.supportdesk.security.dto.LoginRequest;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Shared integration-test infrastructure: boots the full application context
 * (real security filter chain, real datasource - no mocked security/DB), seeds
 * one known ADMIN/AGENT/CUSTOMER user per test method, and exposes a login
 * helper that goes through the real POST /api/auth/login endpoint.
 *
 * @Transactional here wraps each @Test (plus this class's @BeforeEach) in a
 * single transaction that's rolled back afterward, so the seeded users (and
 * anything a test creates) never leak between tests.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public abstract class IntegrationTestBase {

    protected static final String ADMIN_EMAIL = "test-admin@itworx.com";
    protected static final String AGENT_EMAIL = "test-agent@itworx.com";
    protected static final String CUSTOMER_EMAIL = "test-customer@itworx.com";
    protected static final String TEST_PASSWORD = "Password@123";

    @Autowired
    protected MockMvc mockMvc;

    // No ObjectMapper bean is exposed for autowiring in this app context (same
    // reason SecurityExceptionHandling builds its own) - a plain instance here
    // is exactly as "real" for (de)serializing test request/response JSON.
    protected final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected RoleRepository roleRepository;

    @Autowired
    protected UserRoleRepository userRoleRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    protected User adminUser;
    protected User agentUser;
    protected User customerUser;

    @BeforeEach
    void seedTestUsers() {
        adminUser = createUser("Test Admin", ADMIN_EMAIL, "ADMIN");
        agentUser = createUser("Test Agent", AGENT_EMAIL, "AGENT");
        customerUser = createUser("Test Customer", CUSTOMER_EMAIL, "CUSTOMER");
    }

    /**
     * Creates a real user + role assignment directly via the repositories
     * (not through HTTP), BCrypt-hashing the password with the real
     * PasswordEncoder bean. Roles themselves come from DataSeeder, which runs
     * once at application startup and is not rolled back between tests.
     */
    protected User createUser(String name, String email, String roleName) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalStateException(roleName + " role must be seeded (see DataSeeder)"));

        User user = new User(name, email, passwordEncoder.encode(TEST_PASSWORD));
        user = userRepository.save(user);
        userRoleRepository.save(new UserRole(user, role));
        return user;
    }

    /** Logs in as the given user through the real /api/auth/login endpoint and returns the JWT. */
    protected String loginAs(String email) throws Exception {
        return loginAs(email, TEST_PASSWORD);
    }

    protected String loginAs(String email, String password) throws Exception {
        String body = objectMapper.writeValueAsString(new LoginRequest(email, password));

        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("token").asText();
    }
}
