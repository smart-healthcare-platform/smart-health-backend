package fit.iuh.auth.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import fit.iuh.auth.dto.request.DoctorUserCreateEvent;
import fit.iuh.auth.dto.response.DoctorUserCreatedEvent;
import fit.iuh.auth.entity.User;
import fit.iuh.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserConsumer {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UserService userService;
    private final UserProducer userProducer;

    @KafkaListener(topics = "user.create.from.doctor", groupId = "auth-service-group")
    public void listenDoctorUserCreate(String message) {
        try {
            DoctorUserCreateEvent event = objectMapper.readValue(message, DoctorUserCreateEvent.class);

            log.info("Received user.create.from.doctor event: {}", event);

            User user = userService.createUserForDoctor(
                    event.getFullName(),
                    event.getDob(),
                    event.getEmail()
            );

            DoctorUserCreatedEvent createdEvent = new DoctorUserCreatedEvent();
            createdEvent.setDoctorId(event.getDoctorId());
            createdEvent.setUserId(user.getId().toString());
            createdEvent.setCorrelationId(event.getCorrelationId());

            userProducer.sendDoctorUserCreated(createdEvent);

        } catch (Exception e) {
            log.error("Error processing user.create.from.doctor event: {}", message, e);
        }
    }

}
