# Ngày 1: Khởi tạo Project & Cấu trúc lõi

**Mục tiêu:** Thiết lập nền tảng vững chắc cho Medicine Service.

## Tasks

1.  **Khởi tạo dự án Spring Boot:**

    - Sử dụng Spring Initializr với Gradle.
    - Ngôn ngữ: Java 21.
    - Group ID: `com.smarthealth`
    - Artifact ID: `medicine`

2.  **Cấu hình Dependencies:**

    - `spring-boot-starter-web`: Xây dựng RESTful APIs.
    - `spring-boot-starter-data-jpa`: Tương tác cơ sở dữ liệu.
    - `spring-boot-starter-security`: Bảo mật endpoints.
    - `spring-boot-starter-validation`: Xác thực dữ liệu đầu vào.
    - `mysql`: Driver cho MySQL.
    - `flywaydb` hoặc `liquibase`: Quản lý version của schema CSDL.
    - `lombok`

3.  **Tạo JPA Entities:**

    - `Drug.java`: Đại diện cho bảng `DRUG`.
    - `Prescription.java`: Đại diện cho bảng `PRESCRIPTION`.
    - `PrescriptionItem.java`: Đại diện cho bảng `PRESCRIPTION_ITEM`.
    - Sử dụng các annotation của Jakarta Persistence (`@Entity`, `@Id`, `@ManyToOne`, etc.).

4.  **Cấu hình Cơ sở dữ liệu:**

    - Cấu hình `application.properties` hoặc `application.yml` để kết nối tới MySQL.
    - **Tạo script SQL đầu tiên cho Flyway/Liquibase:**

      - **Giải thích:** Flyway/Liquibase là công cụ giúp tự động hóa việc cập nhật cấu trúc cơ sở dữ liệu (schema). Thay vì phải chạy file SQL thủ công, chúng ta tạo các file script được đánh phiên bản (ví dụ: `V1__Initial_Schema.sql`). Khi ứng dụng khởi động, Flyway sẽ tự động chạy những script mới để đảm bảo CSDL luôn đúng phiên bản.
      - **Script đầu tiên (`V1__Initial_Schema.sql`):** Đây là script định nghĩa cấu trúc ban đầu, chứa các lệnh `CREATE TABLE` cho `DRUG`, `PRESCRIPTION`, và `PRESCRIPTION_ITEM` dựa trên ERD. Ví dụ:

        ```sql
        CREATE TABLE drug (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            -- ... các cột khác
        );
        ```

      - **Tại sao không dùng tính năng tự tạo bảng của JPA?**
        - Bạn đã nêu một điểm rất chính xác. JPA (Hibernate) có thể tự tạo bảng với `spring.jpa.hibernate.ddl-auto=update`. Tuy nhiên, cách này **rất rủi ro cho môi trường production** vì nó có thể đoán sai và làm mất dữ liệu khi có thay đổi phức tạp (ví dụ: đổi tên cột).
        - **Thực hành tốt nhất (Best Practice):** Flyway/Liquibase cho phép chúng ta kiểm soát 100% các thay đổi bằng các script SQL tường minh, có phiên bản, an toàn và dễ dàng rollback. Vì vậy, trong môi trường production, `ddl-auto` sẽ được đặt thành `validate` hoặc `none`.

## Công nghệ sử dụng

- **Framework:** Spring Boot 3.x
- **Ngôn ngữ:** Java 21
- **Build Tool:** Gradle
- **CSDL:** MySQL
- **Schema Migration:** Flyway / Liquibase

## Kết quả mong đợi

- Một dự án Spring Boot có thể chạy được.
- Cấu trúc thư mục chuẩn.
- Các file entity đã được định nghĩa.
- Kết nối CSDL thành công.
- Schema CSDL ban đầu được tạo tự động.
