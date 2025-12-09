package fit.iuh.auth.seed;

import fit.iuh.auth.dto.request.RegisterRequest;
import fit.iuh.auth.enums.Gender;
import fit.iuh.auth.repository.UserRepository;
import fit.iuh.auth.service.AuthService;
import fit.iuh.auth.entity.User;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder {

    private final UserRepository userRepository;
    private final AuthService authService;

    @PostConstruct
    public void run() {

        long count = userRepository.count();
        if (count >= 25) {
            log.info("[SEED] Skip seeding because DB has {} users.", count);
            return;
        }

        log.warn("----> SEEDING SAMPLE USERS (20 users) <----  (Current count: {})", count);

        List<RegisterRequest> sampleUsers = List.of(
                build("0355420475", "phamhuuvinh912003@gmail.com", "123456", "Phạm Hữu Vinh", "2003-01-09", Gender.MALE, "TP. HCM"),
                build("0912345002", "binh.tran@example.com", "123456", "Trần Thị Bình", "1999-12-20", Gender.FEMALE, "Hà Nội"),
                build("0912345003", "chien.pham@example.com", "123456", "Phạm Văn Chiến", "2001-10-01", Gender.MALE, "Đà Nẵng"),
                build("0912345004", "dieu.le@example.com", "123456", "Lê Thị Diệu", "1998-03-11", Gender.FEMALE, "Cần Thơ"),
                build("0912345005", "dung.hoang@example.com", "123456", "Hoàng Minh Dũng", "1997-02-23", Gender.MALE, "Hải Phòng"),
                build("0912345006", "tuan.vu@example.com", "123456", "Vũ Tuấn Anh", "1996-02-18", Gender.MALE, "TP. HCM"),
                build("0912345007", "trang.do@example.com", "123456", "Đỗ Huyền Trang", "2000-04-07", Gender.FEMALE, "Hà Nội"),
                build("0912345008", "tam.bui@example.com", "123456", "Bùi Thanh Tâm", "1995-11-02", Gender.FEMALE, "Đà Lạt"),
                build("0912345009", "huy.phan@example.com", "123456", "Phan Quốc Huy", "2001-08-08", Gender.MALE, "Nha Trang"),
                build("0912345010", "ha.trinh@example.com", "123456", "Trịnh Thu Hà", "1998-05-10", Gender.FEMALE, "Huế"),

                build("0912345011", "bao.ha@example.com", "123456", "Hà Gia Bảo", "1994-02-14", Gender.MALE, "Sóc Trăng"),
                build("0912345012", "lan.dang@example.com", "123456", "Đặng Ngọc Lan", "1999-12-26", Gender.FEMALE, "Hà Nội"),
                build("0912345013", "phat.quach@example.com", "123456", "Quách Tấn Phát", "1996-10-18", Gender.MALE, "TP. HCM"),
                build("0912345014", "duyen.nguyen@example.com", "123456", "Nguyễn Mỹ Duyên", "1995-04-04", Gender.FEMALE, "Bình Dương"),
                build("0912345015", "giao.vo@example.com", "123456", "Võ Quỳnh Giao", "1997-07-09", Gender.FEMALE, "Vũng Tàu"),
                build("0912345016", "khanh.nguyen@example.com", "123456", "Nguyễn Quốc Khánh", "1993-09-17", Gender.MALE, "Hà Tĩnh"),
                build("0912345017", "duy.luong@example.com", "123456", "Lương Ngọc Duy", "2002-06-12", Gender.MALE, "Kon Tum"),
                build("0912345018", "kiet.dao@example.com", "123456", "Đào Anh Kiệt", "1996-08-21", Gender.MALE, "Hải Dương"),
                build("0912345019", "phuong.mai@example.com", "123456", "Mai Thu Phương", "1995-05-19", Gender.FEMALE, "Cần Thơ"),
                build("0912345020", "hang.ly@example.com", "123456", "Lý Thanh Hằng", "1998-01-14", Gender.FEMALE, "Hà Nội")
        );

        sampleUsers.forEach(req -> {
            try {
                User u = authService.registerUser(req);
                log.info("Seeded: {} ({})", u.getEmail(), u.getUsername());
            } catch (Exception e) {
                log.error("Seed failed for {} : {}", req.getEmail(), e.getMessage());
            }
        });

        log.warn("----> SEEDING COMPLETE <----");
    }

    private RegisterRequest build(
            String phone,
            String email,
            String password,
            String fullName,
            String dob,
            Gender gender,
            String address
    ) {
        RegisterRequest r = new RegisterRequest();
        r.setPhone(phone);
        r.setEmail(email);
        r.setPassword(password);
        r.setFullName(fullName);
        r.setDateOfBirth(dob);
        r.setGender(gender);
        r.setAddress(address);
        return r;
    }
}
