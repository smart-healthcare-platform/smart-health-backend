package fit.iuh.auth.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cglib.core.Local;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DoctorUserCreateEvent {
    private String doctorId;
    private String email;
    private String fullName;
    private String dob;
    private String correlationId;
}
