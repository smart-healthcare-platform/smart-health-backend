package fit.iuh.auth.util;

import java.text.Normalizer;
import java.time.LocalDate;

public class UsernameGenerator {

    public static String generateUsername(String fullName, String dobString) {
        if (fullName == null || dobString == null) return "";

        LocalDate dob = LocalDate.parse(dobString);

        String normalized = Normalizer.normalize(fullName, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("đ", "d")
                .replace("Đ", "D");

        String[] parts = normalized.trim().toLowerCase().split("\\s+");
        if (parts.length == 0) return "";

        String first = parts[0];
        String last = parts[parts.length - 1];

        int year = dob.getYear();

        return first + "_" + last + year;
    }

}
