package fit.iuh.auth.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import fit.iuh.auth.dto.request.UserCreatedEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class UserProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public UserProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();

        // Add module hỗ trợ Java 8 Date/Time
        objectMapper.registerModule(new JavaTimeModule());

        // Serialize LocalDate thành ISO string, không dùng array
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    public void sendUserCreated(UserCreatedEvent event) {
        try {
            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send("user.created", event.getId(), message);
            System.out.println("📤 Sent user.created event: " + message);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing UserCreatedEvent", e);
        }
    }
}
