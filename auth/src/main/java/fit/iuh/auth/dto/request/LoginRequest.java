package fit.iuh.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    
    @NotBlank(message = "Email không được để trống")
    private String email;
    
    @NotBlank(message = "Password không được để trống")
    private String password;
} 