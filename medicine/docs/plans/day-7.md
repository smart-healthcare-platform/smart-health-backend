# Ngày 7: API Thống kê & Hoàn thiện Bảo mật (UC-04)

**Mục tiêu:** Cung cấp dữ liệu cho quản trị viên và đảm bảo toàn bộ service được bảo mật.

## Tasks

1.  **Xây dựng API Thống kê:**
    *   Tạo `StatisticsController` với endpoint `GET /api/v1/statistics/top-drugs`.
    *   Tạo `StatisticsService` để xử lý logic.
    *   Trong `PrescriptionItemRepository`, viết một câu truy vấn JPQL phức tạp để nhóm các loại thuốc, đếm số lần được kê và sắp xếp giảm dần.
    *   Endpoint này nên được bảo vệ, chỉ cho phép vai trò (role) `ADMIN` truy cập.

2.  **Cấu hình Spring Security:**
    *   Tạo một `SecurityConfig` class (extends `WebSecurityConfigurerAdapter` hoặc sử dụng `SecurityFilterChain` bean).
    *   **Cấu hình JWT Filter:**
        *   Tạo một filter tùy chỉnh (custom filter) để đọc JWT từ header `Authorization`.
        *   Sử dụng thư viện `jjwt` để giải mã và xác thực token.
        *   Nếu token hợp lệ, lấy thông tin người dùng (user ID, roles) và thiết lập `SecurityContextHolder`.
    *   **Phân quyền Endpoints:**
        *   Sử dụng `http.authorizeHttpRequests()` để cấu hình quyền truy cập.
        *   `/api/v1/internal/**`: Chỉ cho phép truy cập từ các IP nội bộ hoặc yêu cầu có một secret key đặc biệt.
        *   `/api/v1/statistics/**`: Yêu cầu vai trò `ADMIN`.
        *   Các endpoints khác: Yêu cầu vai trò `DOCTOR` hoặc `SYSTEM`.

3.  **Viết Unit Tests cho Bảo mật:**
    *   Viết test để đảm bảo các endpoint được bảo vệ đúng cách, trả về lỗi 401/403 khi truy cập không hợp lệ.

## Công nghệ sử dụng

*   **Framework:** Spring Security, Spring Boot.
*   **JWT Library:** `io.jsonwebtoken:jjwt`.
*   **Database:** JPQL/SQL.

## Kết quả mong đợi

*   API thống kê cung cấp dữ liệu chính xác về các loại thuốc được sử dụng nhiều nhất.
*   Tất cả các API của Medicine Service đều được bảo vệ.
*   Hệ thống có khả năng phân quyền dựa trên vai trò của người dùng (lấy từ JWT).
*   API nội bộ được bảo vệ để tránh bị lạm dụng từ bên ngoài.
*   Dự án đạt được mức độ hoàn thiện cơ bản, sẵn sàng cho giai đoạn kiểm thử tích hợp (integration testing).