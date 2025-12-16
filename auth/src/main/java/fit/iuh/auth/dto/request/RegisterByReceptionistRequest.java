package fit.iuh.auth.dto.request;

import fit.iuh.auth.enums.Gender;
import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * DTO for receptionist to register walk-in patients
 * Used when patient comes directly to the hospital without prior registration
 */
@Data
public class RegisterByReceptionistRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ tên phải có độ dài từ 2-100 ký tự")
    private String fullName;

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

    @NotBlank(message = "Ngày sinh không được để trống")
    @Pattern(
            regexp = "^\\d{4}-\\d{2}-\\d{2}$",
            message = "Ngày sinh phải có định dạng yyyy-MM-dd"
    )
    private String dateOfBirth;

    @NotNull(message = "Giới tính không được để trống")
    private Gender gender;

    @Size(max = 255, message = "Địa chỉ không quá 255 ký tự")
    private String address;

    @Size(max = 500, message = "Ghi chú không quá 500 ký tự")
    private String notes; // Ghi chú của lễ tân về bệnh nhân
}
