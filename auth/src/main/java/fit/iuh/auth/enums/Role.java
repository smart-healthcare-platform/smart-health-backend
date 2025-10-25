package fit.iuh.auth.enums;

public enum Role {
    PATIENT("PATIENT"),
    DOCTOR("DOCTOR"),
    RECEPTIONIST("RECEPTIONIST"),
    ADMIN("ADMIN");

    private final String value;

    Role(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
} 