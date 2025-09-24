package com.smarthealth.medicine.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF protection. This is common for stateless APIs where token-based authentication is used.
                // For development, it's safe to disable. In production, ensure you understand the implications.
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Permit all requests to any endpoint under /api/.
                        // This is a temporary measure for development.
                        .requestMatchers("/api/**").permitAll()
                        // Any other request that doesn't match the above must be authenticated.
                        .anyRequest().authenticated()
                );
        return http.build();
    }
}