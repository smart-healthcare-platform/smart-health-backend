package com.smarthealth.medicine.config;

import com.smarthealth.medicine.filter.GatewayJwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

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
                        .requestMatchers("/api/v1/drugs").permitAll() // Public access for drug search
                        .requestMatchers("/api/v1/prescriptions").hasRole("DOCTOR") // Only DOCTOR can create prescriptions
                        .requestMatchers("/api/v1/prescriptions/{id}").hasAnyRole("DOCTOR", "PATIENT", "ADMIN") // Doctor, Patient, Admin can view own prescription
                        .requestMatchers("/api/v1/patients/{patientId}/prescriptions").hasAnyRole("DOCTOR", "PATIENT", "ADMIN") // Doctor, Patient, Admin can view patient prescriptions
                        .requestMatchers("/api/v1/internal/**").hasRole("ADMIN") // Internal APIs for ADMIN only
                        .anyRequest().authenticated()
                )
                .addFilterBefore(new GatewayJwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}