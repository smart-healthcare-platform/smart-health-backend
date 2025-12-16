package fit.iuh.auth.dto.response;

import fit.iuh.auth.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO when receptionist registers a walk-in patient
 * Contains user info and temporary password
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceptionistRegisterResponse {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private UUID id;
        private String username;
        private String email;
        private String fullName;
        private Role role;
        private LocalDateTime createdAt;
    }

    private UserInfo user;
    private String temporaryPassword;
    private String patientId; // Will be set after Patient service processes the event
    private String message;
}
