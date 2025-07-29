package fit.iuh.auth.enums;

public enum Role {
    PATIENT("PATIENT"),
    DOCTOR("DOCTOR"), 
    ADMIN("ADMIN");

    private final String value;

    Role(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
} 