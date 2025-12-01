package fit.iuh.auth.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import fit.iuh.auth.dto.request.UserCreatedEvent;
import fit.iuh.auth.dto.response.DoctorUserCreatedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class UserProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public UserProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();

        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    public void sendUserCreated(UserCreatedEvent event) {
        try {
            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send("user.created", event.getUser_id(), message);
            log.info("Sent user.created event: {}", message);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing UserCreatedEvent", e);
        }
    }

    public void sendDoctorUserCreated(DoctorUserCreatedEvent event) {
        try {
            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send("doctor.user.created", message);
            log.info("Sent doctor.user.created event: {}", message);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing DoctorUserCreatedEvent", e);
        }
    }

}
