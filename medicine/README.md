# **Tài liệu Đặc tả Yêu cầu: Service Quản lý Thuốc**

**Version:** 1.1
**Ngày cập nhật:** 2025-09-13
**Author:** Vgng

## **1. Giới thiệu**

### **1.1. Mục đích**

Tài liệu này đặc tả các yêu cầu về chức năng và phi chức năng cho **Service Quản lý Thuốc (Medicine Service)**. Service này là một thành phần cốt lõi trong hệ thống Chăm sóc Sức khỏe cho Bệnh nhân Tim mạch, có nhiệm vụ số hóa và tối ưu hóa quy trình kê đơn thuốc, nâng cao độ an toàn cho bệnh nhân thông qua các cơ chế kiểm tra tự động, và cung cấp dữ liệu cho các phân hệ khác.

### **1.2. Bối cảnh Hệ thống**

Medicine Service là một microservice hoạt động trong một hệ sinh thái phần mềm y tế lớn hơn. Service này không có giao diện người dùng trực tiếp mà cung cấp các API để tương tác với các thành phần khác, bao gồm:

*   **Giao diện Bác sĩ (Doctor's Portal/UI):** Nơi bác sĩ thực hiện các thao tác nghiệp vụ.
*   **Patient Service:** Nguồn cung cấp thông tin định danh và lịch sử y tế của bệnh nhân.
*   **Notification Service:** Chịu trách nhiệm gửi các loại thông báo (Email, SMS, Push Notification) đến bệnh nhân.
*   **Ứng dụng Bệnh nhân (Patient App):** Cung cấp các tiện ích cho bệnh nhân như xem lại đơn thuốc, lịch uống thuốc.
*   **Billing Service:** Xử lý các nghiệp vụ liên quan đến thanh toán viện phí.

### **1.3. Phạm vi**

#### **Chức năng trong phạm vi (In-Scope):**

*   Nghiệp vụ tạo, truy vấn và quản lý đơn thuốc điện tử với các trạng thái.
*   Tích hợp module Hỗ trợ Quyết định Lâm sàng (CDSS) để kiểm tra tương tác thuốc, liều lượng và dị ứng.
*   Tạo lập lịch trình uống thuốc chi tiết và khởi tạo yêu cầu gửi thông báo đến Notification Service.
*   Kết xuất (export) đơn thuốc ra định dạng PDF theo mẫu chuẩn sau khi thanh toán phí khám bệnh được xác nhận.
*   Cung cấp các API để các service khác truy xuất dữ liệu liên quan đến thuốc và đơn thuốc.
*   Tổng hợp dữ liệu và cung cấp các báo cáo thống kê trực quan.

#### **Chức năng ngoài phạm vi (Out-of-Scope):**

*   Quản lý quy trình đăng ký khám bệnh và chẩn đoán lâm sàng (do Appointment Service, Patient Service đảm nhận).
*   Tích hợp trực tiếp với hệ thống quản lý của các nhà thuốc bên ngoài (Optional).
*   Quản lý tồn kho thuốc (Optional).
*   Xử lý quy trình và giao diện thu phí khám chữa bệnh (do Billing Service đảm nhận).

### **1.4. Đối tượng sử dụng (Actors)**

*   **Bác sĩ (Doctor):** Người dùng chính, trực tiếp tạo và quản lý đơn thuốc thông qua giao diện người dùng (UI).
*   **Quản trị viên Hệ thống (Administrator):** Truy cập vào các báo cáo, thống kê để theo dõi và đánh giá.
*   **Hệ thống/Service khác (System):** Các service khác trong hệ sinh thái (Patient Service, Notification Service, Billing Service) gọi đến API của Medicine Service để thực thi các nghiệp vụ liên quan.

## **2. Kiến trúc và Tích hợp**

### **2.1. Sơ đồ Kiến trúc Tổng quan**

```mermaid
graph TD
    subgraph "Client Applications"
        UI_Doctor[Giao diện Bác sĩ]
        PatientApp[Ứng dụng Bệnh nhân]
    end

    subgraph "Backend Services"
        APIGW(API Gateway)
        MedS(<b>Medicine Service</b>)
        PS(Patient Service)
        NS(Notification Service)
        BS(Billing Service)
    end
    
    subgraph "Data Storage"
        MedDB[(Medicine DB)]
    end

    UI_Doctor --> APIGW
    PatientApp --> APIGW
    APIGW --> MedS
    
    MedS -->|REST API Request| PS
    MedS -->|Async Message/API| NS
    BS -->|REST API Request| MedS
    MedS <--> MedDB

    linkStyle 3 stroke:#ff9900,stroke-width:2px,fill:none;
    linkStyle 4 stroke:#ff9900,stroke-width:2px,fill:none;
    linkStyle 5 stroke:#00aaff,stroke-width:2px,fill:none;
```

### **2.2. Các Service phụ thuộc và Tương tác**

*   **Patient Service:** Medicine Service yêu cầu truy cập thông tin bệnh nhân (ID, tuổi, cân nặng, tiền sử dị ứng) để phục vụ cho CDSS và tạo đơn thuốc.
*   **Notification Service:** Medicine Service gửi yêu cầu kèm theo lịch trình uống thuốc để service này thực hiện việc nhắc nhở bệnh nhân.
*   **Tương tác từ Billing Service:** `Medicine Service` sẽ không chủ động gọi đến `Billing Service`. Thay vào đó, nó sẽ cung cấp một API nội bộ để `Billing Service` có thể gọi vào và cập nhật trạng thái của đơn thuốc (ví dụ: từ "Chờ thanh toán" sang "Hoàn thành") sau khi bệnh nhân đã thanh toán xong phí khám bệnh.

## **3. Yêu cầu Chức năng (Functional Requirements)**

### **UC-01: Bác sĩ Quản lý Đơn thuốc Điện tử**

*   **Mô tả:** Bác sĩ tạo, xem xét và hoàn tất đơn thuốc cho bệnh nhân. Đơn thuốc chỉ có hiệu lực sau khi bệnh nhân hoàn tất thanh toán phí khám bệnh.
*   **Actor:** Bác sĩ.
*   **Luồng sự kiện chính:**
    1.  Bác sĩ chọn bệnh nhân trên giao diện và chọn chức năng "Tạo đơn thuốc mới".
    2.  Giao diện gửi yêu cầu đến Medicine Service. Service lấy thông tin cần thiết của bệnh nhân từ Patient Service (như tiền sử dị ứng).
    3.  Bác sĩ tìm kiếm và thêm từng loại thuốc vào đơn. Với mỗi loại thuốc, bác sĩ nhập các thông tin: hàm lượng, liều dùng, tần suất, đường dùng, thời điểm dùng, thời gian dùng và các ghi chú đặc biệt.
    4.  **(Kích hoạt UC-02)** Với mỗi lần thêm/thay đổi thuốc, hệ thống ngầm thực thi các kiểm tra của CDSS và hiển thị cảnh báo ngay lập tức nếu có.
    5.  Sau khi thêm đủ các thuốc, bác sĩ chọn **"Hoàn tất và Gửi thanh toán"**.
    6.  Medicine Service lưu trữ đơn thuốc vào cơ sở dữ liệu với trạng thái ban đầu là **`PENDING_PAYMENT`**, tạo một mã định danh duy nhất (`prescription_id`) và trả về cho giao diện.
    7.  **(Kích hoạt UC-03)** Đồng thời, service tạo lịch trình uống thuốc và gửi yêu cầu đến Notification Service.
    8.  Giao diện người dùng hiển thị thông báo "Đơn thuốc đang chờ bệnh nhân thanh toán phí khám bệnh". Chức năng "In đơn thuốc" sẽ bị vô hiệu hóa ở bước này.
    9.  **(Luồng tiếp theo)** Sau khi `Billing Service` xác nhận thanh toán và gọi vào API của `Medicine Service`, trạng thái đơn thuốc sẽ được cập nhật thành `COMPLETED`. Lúc này, chức năng "In đơn thuốc" mới được kích hoạt cho bác sĩ và đơn thuốc mới có thể được truy cập bởi bệnh nhân qua Patient App.

### **UC-02: Hệ thống Hỗ trợ Quyết định Lâm sàng (CDSS)**

*   **Mô tả:** Một module tự động chạy nền để cung cấp các cảnh báo an toàn dược cho bác sĩ ngay tại thời điểm kê đơn.
*   **Actor:** Hệ thống.
*   **Các quy tắc nghiệp vụ:**
    *   **Cảnh báo Tương tác thuốc:**
        *   **Trigger:** Khi một thuốc mới được thêm vào đơn đã có sẵn thuốc khác.
        *   **Process:** Hệ thống đối chiếu cặp hoạt chất của các thuốc trong đơn với cơ sở dữ liệu về tương tác thuốc.
        *   **Output:** Hiển thị cảnh báo với mức độ (Nặng, Trung bình, Nhẹ).
    *   **Kiểm tra Liều lượng:**
        *   **Trigger:** Khi bác sĩ nhập liều lượng cho một loại thuốc.
        *   **Process:** Dựa trên tuổi, cân nặng của bệnh nhân, hệ thống so sánh liều lượng/ngày với liều khuyến cáo tối đa.
        *   **Output:** Hiển thị cảnh báo "Liều vượt ngưỡng".
    *   **Cảnh báo Dị ứng:**
        *   **Trigger:** Khi một thuốc mới được thêm vào đơn.
        *   **Process:** Hệ thống kiểm tra hoạt chất của thuốc với danh sách dị ứng đã ghi nhận trong hồ sơ bệnh nhân.
        *   **Output:** Hiển thị cảnh báo nổi bật "Bệnh nhân có tiền sử dị ứng với [tên hoạt chất]".

### **UC-03: Cung cấp Dữ liệu và Lịch trình cho Bệnh nhân**

*   **Mô tả:** Service cung cấp dữ liệu cho các ứng dụng phía bệnh nhân và khởi tạo quy trình nhắc nhở.
*   **Actor:** Hệ thống (Patient App, Notification Service).
*   **Luồng sự kiện:**
    1.  Khi một đơn thuốc được lưu thành công (từ UC-01).
    2.  Medicine Service xử lý thông tin đơn thuốc để tạo ra một cấu trúc dữ liệu về lịch trình uống thuốc.
    3.  Service gửi một request đến Notification Service, chứa `patient_id` và lịch trình này.
    4.  Đồng thời, service cung cấp các API endpoint để Patient App có thể gọi đến và hiển thị lịch sử đơn thuốc, chi tiết từng đơn (chi tiết đơn thuốc chỉ hiển thị đầy đủ khi trạng thái là `COMPLETED`).

### **UC-04: Báo cáo và Thống kê**

*   **Mô tả:** Cung cấp dashboard với các biểu đồ trực quan cho phép quản trị viên theo dõi hoạt động kê đơn.
*   **Actor:** Quản trị viên.
*   **Các chỉ số yêu cầu:**
    *   Biểu đồ cột: Top 10 loại thuốc được kê đơn nhiều nhất (theo tháng/quý/năm).
    *   Biểu đồ tròn: Tỷ lệ kê đơn theo từng nhóm bệnh tim mạch chính.
    *   Biểu đồ đường: Xu hướng số lượng đơn thuốc được tạo theo thời gian.

## **4. Yêu cầu Phi Chức năng (Non-Functional Requirements)**

*   **Hiệu năng (Performance):**
    *   Thời gian phản hồi của các API đọc dữ liệu (GET) phải dưới 200ms.
    *   Thời gian phản hồi của API tạo đơn thuốc (bao gồm cả kiểm tra CDSS) phải dưới 500ms.
*   **Bảo mật (Security):**
    *   Mọi API endpoint phải được bảo vệ, yêu cầu xác thực và phân quyền (ví dụ: sử dụng JWT).
    *   Dữ liệu nhạy cảm của bệnh nhân phải được mã hóa khi lưu trữ và trên đường truyền.
*   **Tính sẵn sàng (Availability):**
    *   Hệ thống phải đảm bảo độ sẵn sàng 99.9% (uptime).
*   **Khả năng mở rộng (Scalability):**
    *   Kiến trúc service phải cho phép mở rộng theo chiều ngang (horizontal scaling).

## **5. API Endpoints Sơ bộ (Preliminary API Endpoints)**

| Method | Endpoint | Mô tả | Ghi chú |
| :--- | :--- | :--- |:--- |
| `POST` | `/api/v1/prescriptions` | Tạo một đơn thuốc mới. | Đơn thuốc sẽ có trạng thái mặc định là `PENDING_PAYMENT`. |
| `GET` | `/api/v1/prescriptions/{id}` | Lấy chi tiết một đơn thuốc theo ID. | |
| `GET` | `/api/v1/patients/{patientId}/prescriptions` | Lấy danh sách tất cả đơn thuốc của một bệnh nhân. | |
| `GET` | `/api/v1/prescriptions/{id}/pdf` | Tải về file PDF của đơn thuốc. | Yêu cầu quyền và trạng thái đơn thuốc phải là `COMPLETED`. |
| `GET` | `/api/v1/drugs?search={query}` | Tìm kiếm thuốc trong cơ sở dữ liệu. | |
| `GET` | `/api/v1/statistics/top-drugs` | Lấy dữ liệu thống kê về các thuốc được dùng nhiều. | |
| `POST` | `/api/v1/internal/prescriptions/{id}/confirm-payment` | **(API nội bộ)** Cập nhật trạng thái đơn thuốc thành `COMPLETED`. | API này chỉ được gọi bởi `Billing Service`. |

## **6. Mô hình Dữ liệu (Data Model)**

### **6.1. Sơ đồ Quan hệ Thực thể (ERD)**

```mermaid
erDiagram
    PRESCRIPTION {
        bigint id PK
        bigint patient_id "FK to Patient Service"
        bigint doctor_id "FK to User Service"
        varchar diagnosis
        varchar status "e.g., PENDING_PAYMENT, COMPLETED"
        text notes
        datetime created_at
    }

    PRESCRIPTION_ITEM {
        bigint id PK
        bigint prescription_id FK
        bigint drug_id FK
        varchar dosage "e.g., '1 viên'"
        varchar frequency "e.g., '2 lần/ngày'"
        varchar route "e.g., 'Uống'"
        varchar timing "e.g., 'Sau ăn'"
        int duration_days
    }

    DRUG {
        bigint id PK
        varchar name "Tên thương mại"
        varchar active_ingredient "Hoạt chất"
        varchar strength "Hàm lượng, e.g., '500mg'"
    }

    PRESCRIPTION ||--|{ PRESCRIPTION_ITEM : "contains"
    DRUG         ||--o{ PRESCRIPTION_ITEM : "is"

```

### **6.2. Mô tả Bảng**

*   **PRESCRIPTION:** Lưu trữ thông tin chung của một lần kê đơn. `patient_id` và `doctor_id` là các khóa ngoại tham chiếu đến các service khác. Trường `status` dùng để quản lý quy trình thanh toán.
*   **PRESCRIPTION\_ITEM:** Lưu trữ chi tiết từng loại thuốc trong một đơn thuốc.
*   **DRUG:** Bảng danh mục chứa thông tin về các loại thuốc có trong hệ thống.