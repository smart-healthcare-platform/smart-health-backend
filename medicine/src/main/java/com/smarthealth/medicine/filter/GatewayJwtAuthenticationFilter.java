package com.smarthealth.medicine.filter;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class GatewayJwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String X_USER_ID = "X-User-ID";
    private static final String X_USER_ROLE = "X-User-Role";
    private static final String X_USER_AUTHORITIES = "X-User-Authorities";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String userId = request.getHeader(X_USER_ID);
        String userRole = request.getHeader(X_USER_ROLE);
        String userAuthorities = request.getHeader(X_USER_AUTHORITIES);

        if (userId != null && userRole != null) {
            List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
            if (userAuthorities != null && !userAuthorities.isEmpty()) {
                try {
                    // Parse the JSON array string
                    // Example: [{"authority":"ROLE_DOCTOR"}, {"authority":"ROLE_ADMIN"}]
                    // Using Jackson's ObjectMapper for robust JSON parsing
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    List<java.util.Map<String, String>> authorityList = mapper.readValue(userAuthorities, new com.fasterxml.jackson.core.type.TypeReference<List<java.util.Map<String, String>>>() {});
                    authorities = authorityList.stream()
                            .map(map -> new SimpleGrantedAuthority(map.get("authority")))
                            .collect(Collectors.toList());
                } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                    logger.warn("Failed to parse X-User-Authorities header: " + e.getMessage());
                    // Fallback to role if parsing fails
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + userRole.toUpperCase()));
                }
            } else {
                // Fallback: create authority from role header if X-User-Authorities is not present
                authorities.add(new SimpleGrantedAuthority("ROLE_" + userRole.toUpperCase()));
            }

            // Create an authenticated token
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, authorities);

            // Set the authentication in the SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}