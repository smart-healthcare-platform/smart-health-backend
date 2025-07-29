package fit.iuh.auth.controller;

import fit.iuh.auth.dto.request.LoginRequest;
import fit.iuh.auth.dto.request.RegisterRequest;
import fit.iuh.auth.dto.response.ApiResponse;
import fit.iuh.auth.dto.response.AuthResponse;
import fit.iuh.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        try {
            log.info("Registration request for username: {}", request.getUsername());
            AuthResponse authResponse = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Đăng ký thành công", authResponse));
        } catch (Exception e) {
            log.error("Registration failed for username: {}", request.getUsername(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        try {
            log.info("Login request for username: {}", request.getUsername());
            AuthResponse authResponse = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", authResponse));
        } catch (Exception e) {
            log.error("Login failed for username: {}", request.getUsername(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Tên đăng nhập hoặc mật khẩu không đúng", 
                            HttpStatus.UNAUTHORIZED.value()));
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Invalid refresh token format", 
                                HttpStatus.BAD_REQUEST.value()));
            }
            
            String refreshToken = authHeader.substring(7);
            AuthResponse authResponse = authService.refreshToken(refreshToken);
            return ResponseEntity.ok(ApiResponse.success("Token refresh thành công", authResponse));
        } catch (Exception e) {
            log.error("Token refresh failed", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid refresh token", 
                            HttpStatus.UNAUTHORIZED.value()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("Auth service is running"));
    }
} 