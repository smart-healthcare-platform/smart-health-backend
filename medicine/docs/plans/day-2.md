# Ngày 2: API Quản lý Thuốc & Tích hợp Patient Service

**Mục tiêu:** Xây dựng endpoint cho phép bác sĩ tìm kiếm thuốc và chuẩn bị nền tảng để giao tiếp với các service khác.

## Tasks

1.  **Xây dựng API Tìm kiếm Thuốc:**
    *   Tạo `DrugController` với endpoint `GET /api/v1/drugs`.
    *   Endpoint nhận một tham số `?search={query}` để tìm kiếm thuốc theo tên hoặc hoạt chất.
    *   Tạo `DrugService` để xử lý business logic.
    *   Tạo `DrugRepository` (extends `JpaRepository`) với một phương thức custom sử dụng JPQL hoặc Query Creation để tìm kiếm.
    *   **Quan trọng:** DTO trả về phải chứa `stock_status` như trong `README.md`.

2.  **Thiết lập REST Client:**
    *   Cấu hình một bean `RestTemplate` hoặc `WebClient` trong project.
    *   Mục đích: Chuẩn bị cho việc gọi API sang `Patient Service` ở các ngày tiếp theo.
    *   Định nghĩa URL của `Patient Service` trong file `application.properties`.

3.  **Viết Unit Test cơ bản:**
    *   Viết test cho `DrugController` sử dụng `MockMvc`.
    *   Kiểm tra xem API có trả về kết quả đúng định dạng và status code 200 OK hay không.

## Công nghệ sử dụng

*   **Framework:** Spring Boot (`spring-web`, `spring-data-jpa`)
*   **Testing:** JUnit 5, Mockito, `spring-boot-starter-test`
*   **HTTP Client:** `RestTemplate` hoặc `WebClient`

## Kết quả mong đợi

*   Endpoint `GET /api/v1/drugs?search={query}` hoạt động, trả về danh sách thuốc.
*   Dữ liệu trả về có đầy đủ các trường cần thiết, bao gồm `stock_status`.
*   Project đã sẵn sàng để gọi sang các microservice khác.
*   Có unit test cho chức năng tìm kiếm thuốc.