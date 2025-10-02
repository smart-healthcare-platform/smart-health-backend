package fit.iuh.auth.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserCreatedEvent {
    private String id;
    // bổ sung thêm để Patient service nhận đủ
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
}
