package fit.iuh.auth.dto.request;

import fit.iuh.auth.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "Username không được để trống")
    @Size(min = 3, max = 50, message = "Username phải có độ dài từ 3-50 ký tự")
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Size(min = 3, max = 50, message = "Emal phải có độ dài từ 3-50 ký tự")
    @Email
    private String email;
    
    @NotBlank(message = "Password không được để trống")
    @Size(min = 6, message = "Password phải có ít nhất 6 ký tự")
    private String password;
    
    @NotNull(message = "Role không được để trống")
    private Role role;
} 