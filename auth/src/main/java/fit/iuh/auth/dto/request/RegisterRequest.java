package fit.iuh.auth.dto.request;

import fit.iuh.auth.enums.Role;
import fit.iuh.auth.enums.Gender;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterRequest {

    @NotBlank(message = "Username không được để trống")
    @Size(min = 3, max = 50, message = "Username phải có độ dài từ 3-50 ký tự")
    private String username;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(
            regexp = "^(0|\\+84)(3[2-9]|5[689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$",
            message = "Số điện thoại không hợp lệ"
    )
    private String phone;

    @NotBlank(message = "Email không được để trống")
    @Size(min = 3, max = 50, message = "Email phải có độ dài từ 3-50 ký tự")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Password không được để trống")
    @Size(min = 6, message = "Password phải có ít nhất 6 ký tự")
    private String password;

    @NotNull(message = "Role không được để trống")
    private Role role;

    // ---------------- Thêm các field cho Patient ----------------
    @Size(max = 100, message = "Họ tên không quá 100 ký tự")
    private String fullName;

    private LocalDate dateOfBirth;

    @NotNull(message = "Giới tính không được để trống")
    private Gender gender;

    @Size(max = 255, message = "Địa chỉ không quá 255 ký tự")
    private String address;
}
