package com.itworx.supportdesk.security;

import com.itworx.supportdesk.security.filter.JwtAuthFilter;
import com.itworx.supportdesk.security.service.UserPrincipalService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // enables @PreAuthorize on controller/service methods
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserPrincipalService userDetailsService;
    private final SecurityExceptionHandling securityExceptionHandling;

    public SecurityConfig(
            JwtAuthFilter jwtAuthFilter,
            UserPrincipalService userDetailsService,
            SecurityExceptionHandling securityExceptionHandling
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
        this.securityExceptionHandling = securityExceptionHandling;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Stateless JWT API: no CSRF tokens needed (no cookies/sessions to forge)
                .csrf(csrf -> csrf.disable())

                // No HTTP sessions at all - identity is re-derived from the JWT on every request
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authenticationProvider(authenticationProvider())

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(securityExceptionHandling) // 401 - no/invalid/expired token
                        .accessDeniedHandler(securityExceptionHandling)      // 403 - valid token, wrong role
                )

                .authorizeHttpRequests(auth -> auth
                        // Public - no token required (A1). Bootstrapping endpoint only.
                        .requestMatchers("/api/auth/**").permitAll()

                        // Admin-only: catalog writes (B1, B3, B4)
                        .requestMatchers(HttpMethod.POST, "/api/products").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/products/**").hasRole("ADMIN")

                        // Everything else just needs a valid, authenticated caller
                        .anyRequest().authenticated()
                )

                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
