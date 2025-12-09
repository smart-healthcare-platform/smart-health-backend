package fit.iuh.billing.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to validate internal requests from API Gateway
 * Checks for X-Internal-Request header and validates gateway secret
 */
@Component
public class InternalRequestFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(InternalRequestFilter.class);
    
    private static final String INTERNAL_REQUEST_HEADER = "X-Internal-Request";
    private static final String GATEWAY_SECRET_HEADER = "X-Gateway-Secret";
    
    @Value("${gateway.secret}")
    private String gatewaySecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        
        // Allow public endpoints (health check, public APIs)
        if (isPublicEndpoint(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Check if this is an admin endpoint
        if (isAdminEndpoint(requestPath)) {
            String internalHeader = request.getHeader(INTERNAL_REQUEST_HEADER);
            String gatewaySecretHeader = request.getHeader(GATEWAY_SECRET_HEADER);
            
            logger.debug("Admin endpoint accessed: {}", requestPath);
            logger.debug("Internal header: {}", internalHeader);
            logger.debug("Gateway secret present: {}", gatewaySecretHeader != null);
            
            // Validate internal request headers
            if (!"true".equals(internalHeader)) {
                logger.warn("Unauthorized admin access attempt - missing internal header: {}", requestPath);
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"error\":\"Access denied - internal requests only\"}");
                return;
            }
            
            // Validate gateway secret
            if (gatewaySecretHeader == null || !gatewaySecretHeader.equals(gatewaySecret)) {
                logger.warn("Unauthorized admin access attempt - invalid gateway secret: {}", requestPath);
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"error\":\"Access denied - invalid credentials\"}");
                return;
            }
            
            logger.debug("Internal request validated successfully for: {}", requestPath);
        }
        
        // Continue with the request
        filterChain.doFilter(request, response);
    }
    
    /**
     * Check if the endpoint is public (doesn't require internal authentication)
     */
    private boolean isPublicEndpoint(String path) {
        return path.equals("/actuator/health") || 
               path.equals("/health") ||
               path.startsWith("/api/v1/billings/return") ||
               path.startsWith("/api/v1/billings/ipn") ||
               path.startsWith("/actuator/");
    }
    
    /**
     * Check if the endpoint is an admin endpoint (requires internal authentication)
     */
    private boolean isAdminEndpoint(String path) {
        return path.startsWith("/api/v1/admin/");
    }
}