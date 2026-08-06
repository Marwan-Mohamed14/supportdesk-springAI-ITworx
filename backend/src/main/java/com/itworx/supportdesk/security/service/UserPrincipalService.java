package com.itworx.supportdesk.security.service;

import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.UserRole;
import com.itworx.supportdesk.repository.UserRepository;
import com.itworx.supportdesk.repository.UserRoleRepository;
import com.itworx.supportdesk.security.UserPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserPrincipalService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    public UserPrincipalService(UserRepository userRepository, UserRoleRepository userRoleRepository) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));

        List<UserRole> userRoles = userRoleRepository.findByUserId(user.getId());

        return new UserPrincipal(user, userRoles);
    }
}
