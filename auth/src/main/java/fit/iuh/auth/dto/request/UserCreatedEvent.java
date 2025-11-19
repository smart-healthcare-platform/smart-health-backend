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
    private String user_id;
    private String full_name;
    private String date_of_birth;
    private String gender;
    private String address;
    private String phone;
}

