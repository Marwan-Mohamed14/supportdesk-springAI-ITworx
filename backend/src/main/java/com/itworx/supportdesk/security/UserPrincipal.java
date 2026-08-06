package com.itworx.supportdesk.security;

import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.UserRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String name;
    private final String email;
    private final String passwordHash;
    private final List<GrantedAuthority> authorities;

    public UserPrincipal(User user, List<UserRole> userRoles) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.passwordHash = user.getPasswordHash();
        this.authorities = userRoles.stream()
                .map(ur -> ur.getRole().getName())
                .map(roleName -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + roleName))
                .toList();
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email; // Spring Security calls the identity field "username" generically — ours is the email
    }
}
