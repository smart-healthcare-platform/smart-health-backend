package fit.iuh.auth.controller;

import fit.iuh.auth.dto.response.ApiResponse;
import fit.iuh.auth.entity.User;
import fit.iuh.auth.enums.Role;
import fit.iuh.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<User>> getCurrentUser(Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            return ResponseEntity.ok(ApiResponse.success("Thông tin người dùng hiện tại", user));
        } catch (Exception e) {
            log.error("Error getting current user", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không thể lấy thông tin người dùng"));
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        try {
            List<User> users = userService.findAll();
            return ResponseEntity.ok(ApiResponse.success("Danh sách tất cả người dùng", users));
        } catch (Exception e) {
            log.error("Error getting all users", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không thể lấy danh sách người dùng"));
        }
    }

    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getActiveUsers() {
        try {
            List<User> users = userService.findAllActiveUsers();
            return ResponseEntity.ok(ApiResponse.success("Danh sách người dùng đang hoạt động", users));
        } catch (Exception e) {
            log.error("Error getting active users", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không thể lấy danh sách người dùng"));
        }
    }

    @GetMapping("/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getUsersByRole(@PathVariable Role role) {
        try {
            List<User> users = userService.findByRole(role);
            return ResponseEntity.ok(ApiResponse.success("Danh sách người dùng theo vai trò", users));
        } catch (Exception e) {
            log.error("Error getting users by role: {}", role, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không thể lấy danh sách người dùng"));
        }
    }

    @PutMapping("/{userId}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> deactivateUser(@PathVariable UUID userId) {
        try {
            User user = userService.deactivateUser(userId);
            return ResponseEntity.ok(ApiResponse.success("Đã vô hiệu hóa tài khoản", user));
        } catch (Exception e) {
            log.error("Error deactivating user: {}", userId, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không thể vô hiệu hóa tài khoản"));
        }
    }

    @PutMapping("/{userId}/activate")
    @PreAuthorize("hasRole('ADMIN')")
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

    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
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
} 