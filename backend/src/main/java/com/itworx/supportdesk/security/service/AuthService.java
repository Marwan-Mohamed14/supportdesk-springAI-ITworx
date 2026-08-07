package com.itworx.supportdesk.security.service;

import com.itworx.supportdesk.exception.DuplicateEmailException;
import com.itworx.supportdesk.model.Role;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.UserRole;
import com.itworx.supportdesk.repository.RoleRepository;
import com.itworx.supportdesk.repository.UserRepository;
import com.itworx.supportdesk.repository.UserRoleRepository;
import com.itworx.supportdesk.security.dto.LoginRequest;
import com.itworx.supportdesk.security.dto.LoginResponse;
import com.itworx.supportdesk.security.dto.RegisterRequest;
import com.itworx.supportdesk.security.service.JwtService;
import com.itworx.supportdesk.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthService {

    private static final String DEFAULT_SIGNUP_ROLE = "CUSTOMER";

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (org.springframework.security.core.AuthenticationException e) {
            throw new BadCredentialsException("Invalid email or password");
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        return toResponse(principal);
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateEmailException(request.email());
        }

        Role defaultRole = roleRepository.findByName(DEFAULT_SIGNUP_ROLE)
                .orElseThrow(() -> new IllegalStateException(
                        DEFAULT_SIGNUP_ROLE + " role must be seeded before registration is possible"));

        User user = userRepository.save(
                new User(request.name(), request.email(), passwordEncoder.encode(request.password()))
        );
        UserRole userRole = userRoleRepository.save(new UserRole(user, defaultRole));

        // Built straight from what was just persisted - no need to round-trip through
        // AuthenticationManager, the password was only just hashed by us right above.
        UserPrincipal principal = new UserPrincipal(user, List.of(userRole));

        return toResponse(principal);
    }

    private LoginResponse toResponse(UserPrincipal principal) {
        String token = jwtService.generateToken(principal);

        List<String> roles = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.replace("ROLE_", ""))
                .toList();

        return new LoginResponse(
                token,
                principal.getId(),
                principal.getName(),
                principal.getUsername(),
                roles
        );
    }
}
