package fit.iuh.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DoctorUserCreatedEvent {
    private String doctorId;
    private String userId;
    private String correlationId;
}