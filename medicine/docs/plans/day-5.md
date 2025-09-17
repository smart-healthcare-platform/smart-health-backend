# Ngày 5: Xây dựng Module Hỗ trợ Quyết định Lâm sàng (CDSS - UC-02)

**Mục tiêu:** Nâng cao an toàn cho bệnh nhân bằng cách tích hợp các quy tắc kiểm tra tự động vào quy trình kê đơn.

## Tasks

1.  **Thiết kế Module CDSS:**
    *   Tạo một package mới `com.smarthealth.medicine.cdss`.
    *   Tạo `CDSSService` để chứa logic kiểm tra.
    *   Thiết kế các interface cho từng quy tắc (ví dụ: `CDSSRule`) để dễ dàng mở rộng trong tương lai (ví dụ: `AllergyCheckRule`, `DosageCheckRule`).

2.  **Implement Quy tắc Cảnh báo Dị ứng:**
    *   Đây là quy tắc ưu tiên hàng đầu.
    *   Trong `CDSSService`, tạo phương thức `checkAllergies(Prescription prescription, Patient patient)`.
    *   Logic: Lấy danh sách thuốc trong đơn và so sánh với danh sách dị ứng của bệnh nhân (lấy từ `Patient Service`).
    *   Nếu phát hiện trùng khớp, ném ra một `CDSSException` hoặc trả về một đối tượng `CDSSWarning`.

3.  **Tích hợp CDSS vào Luồng Tạo Đơn thuốc:**
    *   Trong `PrescriptionService` (từ Ngày 3), sau khi đã có thông tin bệnh nhân và danh sách thuốc, hãy gọi `cdssService.runChecks(...)`.
    *   Xử lý kết quả từ CDSS: Nếu có cảnh báo, có thể ghi log, hoặc ném exception để chặn việc tạo đơn (tùy theo yêu cầu nghiệp vụ).

4.  **Chuẩn bị cho các quy tắc khác:**
    *   Tạo các class placeholder cho `DrugInteractionRule` và `DosageCheckRule` để sẵn sàng implement trong tương lai.

## Công nghệ sử dụng

*   **Design Patterns:** Strategy Pattern (mỗi quy tắc CDSS là một strategy).
*   **Framework:** Spring Boot.

## Kết quả mong đợi

*   Module CDSS được tích hợp vào luồng tạo đơn thuốc.
*   Hệ thống có khả năng cảnh báo khi bác sĩ kê một loại thuốc mà bệnh nhân bị dị ứng.
*   Cấu trúc code của CDSS linh hoạt, sẵn sàng để thêm các quy tắc kiểm tra phức tạp hơn.
*   Tính năng an toàn cốt lõi của Medicine Service được hình thành.