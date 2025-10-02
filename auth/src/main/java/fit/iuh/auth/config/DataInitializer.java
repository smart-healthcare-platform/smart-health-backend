//package fit.iuh.auth.config;
//
//import fit.iuh.auth.entity.User;
//import fit.iuh.auth.enums.Role;
//import fit.iuh.auth.service.UserService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.security.crypto.password.PasswordEncoder;
//
//import java.util.stream.IntStream;
//
//@Configuration
//@RequiredArgsConstructor
//public class DataInitializer implements CommandLineRunner {
//
//    private final UserService userService;
//    private final PasswordEncoder passwordEncoder;
//
//    @Override
//    public void run(String... args) {
//        try {
//            if (userService.findAll().isEmpty()) {
//                // 1. Tạo admin
//                User admin = new User();
//                admin.setUsername("admin");
//                admin.setEmail("phamhuuvinh0901@gmail.com");
//                admin.setPasswordHash(passwordEncoder.encode("123456"));
//                admin.setRole(Role.ADMIN);
//                admin.setIsActive(true);
//                userService.save(admin);
//
//                // 2. Tạo 50 user thường
//                IntStream.rangeClosed(1, 50).forEach(i -> {
//                    User user = new User();
//                    user.setUsername("user" + i);
//                    user.setEmail("user" + i + "@example.com");
//                    user.setPasswordHash(passwordEncoder.encode("123456"));
//                    user.setRole(Role.PATIENT);
//                    user.setIsActive(true);
//                    userService.save(user);
//                });
//
//                System.out.println("✅ Đã tạo 1 admin + 50 user demo thành công!");
//            }
//        } catch (Exception e) {
//            System.err.println("⚠️ Lỗi khi khởi tạo dữ liệu demo: " + e.getMessage());
//            e.printStackTrace();
//        }
//    }
//}
