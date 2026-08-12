package com.itworx.supportdesk;

import com.itworx.supportdesk.security.dto.LoginRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends IntegrationTestBase {

    @Test
    void loginWithCorrectCredentialsReturnsTokenAndMatchingRole() throws Exception {
        String body = objectMapper.writeValueAsString(new LoginRequest(ADMIN_EMAIL, TEST_PASSWORD));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.roles[0]").value("ADMIN"));
    }

    @Test
    void loginWithWrongPasswordReturns401WithGenericMessage() throws Exception {
        String body = objectMapper.writeValueAsString(new LoginRequest(ADMIN_EMAIL, "definitely-wrong-password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Invalid email or password."));
    }

    @Test
    void loginWithUnknownEmailReturnsSameGenericMessageAsWrongPassword() throws Exception {
        // Deliberate security property: DaoAuthenticationProvider hides the
        // "user not found" case behind the same BadCredentialsException as a
        // wrong password (see UserPrincipalService + AuthService.login), so an
        // attacker can't use the login response to enumerate valid emails.
        String body = objectMapper.writeValueAsString(new LoginRequest("no-such-user@itworx.com", "whatever"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Invalid email or password."));
    }

    @Test
    void protectedEndpointWithNoTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointWithGarbageTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/products")
                        .header("Authorization", "Bearer this.is.not.a.valid.jwt"))
                .andExpect(status().isUnauthorized());
    }
}
