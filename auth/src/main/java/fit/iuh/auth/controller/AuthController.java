package fit.iuh.auth.controller;

import fit.iuh.auth.dto.request.LoginRequest;
import fit.iuh.auth.dto.request.RegisterRequest;
import fit.iuh.auth.dto.response.ApiResponse;
import fit.iuh.auth.dto.response.AuthResponse;
import fit.iuh.auth.entity.User;
import fit.iuh.auth.service.AuthService;
import fit.iuh.auth.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        try {
            log.info("Registration request for email: {}", request.getEmail());
            AuthResponse authResponse = authService.register(request, response);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Đăng ký thành công", authResponse));
        } catch (Exception e) {
            log.error("Registration failed for email: {}", request.getEmail(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        try {
            log.info("Login request for username: {}", request.getEmail());
            AuthResponse authResponse = authService.login(request, response);
            return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", authResponse));
        } catch (Exception e) {
            log.error("Login failed for username: {}", request.getEmail(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Tên đăng nhập hoặc mật khẩu không đúng",
                            HttpStatus.UNAUTHORIZED.value()));
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            HttpServletRequest request,
            HttpServletResponse response) {
        try {
            String refreshToken = extractRefreshTokenFromCookie(request);
            if (refreshToken == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Refresh token not found in cookies",
                                HttpStatus.BAD_REQUEST.value()));
            }

            AuthResponse authResponse = authService.refreshToken(refreshToken, response);
            return ResponseEntity.ok(ApiResponse.success("Token refresh thành công", authResponse));
        } catch (Exception e) {
            log.error("Token refresh failed", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid refresh token",
                            HttpStatus.UNAUTHORIZED.value()));
        }
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                System.out.println(cookie);
                if ("refreshToken".equals(cookie.getName())) {

                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("Auth service is running"));
    }
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response
    ) {
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Không tìm thấy refresh token", 401));
        }

        authService.logout(response, refreshToken);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable UUID userId) {
        try {
            User user = userService.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return ResponseEntity.ok(ApiResponse.success("Thông tin người dùng", user));
        } catch (Exception e) {
            log.error("Error getting user by id: {}", userId, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không thể lấy thông tin người dùng"));
        }
    }

    @PutMapping("/users/de-active/{userId}")
    public ResponseEntity<ApiResponse<User>> deactivateUser(@PathVariable UUID userId) {
        try {
            User user = userService.deActiveUser(userId);
            return ResponseEntity.ok(ApiResponse.success("Đã vô hiệu hóa tài khoản", user));
        } catch (Exception e) {
            log.error("Error deactivating user: {}", userId, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không thể vô hiệu hóa tài khoản"));
        }
    }

    @PutMapping("/users/active/{userId}")
    public ResponseEntity<ApiResponse<User>> activateUser(@PathVariable UUID userId) {
        try {
            User user = userService.activateUser(userId);
            return ResponseEntity.ok(ApiResponse.success("Đã kích hoạt tài khoản", user));
        } catch (Exception e) {
            log.error("Error activating user: {}", userId, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không thể kích hoạt tài khoản"));
        }
    }
}
