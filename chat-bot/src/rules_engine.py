from .utils import normalize_text

RULES = [
    # Các rule về bệnh tim mạch bổ sung
    {
        "keywords": ["suy tim", "bệnh suy tim", "triệu chứng suy tim", "nguyên nhân suy tim", "điều trị suy tim"],
        "response": "Suy tim là tình trạng tim không đủ khả năng bơm máu đáp ứng nhu cầu cơ thể. Triệu chứng gồm khó thở, mệt mỏi, phù chân. Nguyên nhân có thể do bệnh mạch vành, tăng huyết áp, bệnh van tim... Điều trị cần tuân thủ chỉ định bác sĩ, dùng thuốc đều đặn, kiểm soát chế độ ăn và tập luyện."
    },
    {
        "keywords": ["nhồi máu cơ tim", "đau tim cấp", "triệu chứng nhồi máu cơ tim", "xử trí nhồi máu cơ tim"],
        "response": "Nhồi máu cơ tim là tình trạng tắc nghẽn động mạch vành cấp tính, gây hoại tử cơ tim. Dấu hiệu: đau ngực dữ dội, lan ra tay/trái/cằm, vã mồ hôi, khó thở. Nếu nghi ngờ, hãy gọi cấp cứu 115 ngay lập tức."
    },
    {
        "keywords": ["bệnh mạch vành", "động mạch vành", "thiếu máu cơ tim", "đau thắt ngực"],
        "response": "Bệnh mạch vành là tình trạng hẹp/tắc động mạch nuôi tim, gây thiếu máu cơ tim. Triệu chứng: đau thắt ngực khi gắng sức, khó thở. Điều trị gồm thuốc, thay đổi lối sống, can thiệp mạch vành nếu cần."
    },
    {
        "keywords": ["rối loạn nhịp tim", "loạn nhịp tim", "tim đập nhanh", "tim đập chậm", "rung nhĩ"],
        "response": "Rối loạn nhịp tim là tình trạng tim đập không đều, có thể nhanh hoặc chậm. Rung nhĩ là dạng phổ biến, làm tăng nguy cơ đột quỵ. Nếu có triệu chứng hồi hộp, choáng váng, hãy đi khám bác sĩ tim mạch."
    },
    {
        "keywords": ["hẹp van tim", "bệnh van tim", "hở van tim", "van hai lá", "van động mạch chủ"],
        "response": "Bệnh van tim là tình trạng van tim bị hẹp hoặc hở, ảnh hưởng đến lưu thông máu. Triệu chứng: mệt, khó thở, phù chân. Điều trị tùy mức độ, có thể dùng thuốc hoặc phẫu thuật."
    },
    {
        "keywords": ["chế độ ăn cho người bệnh tim", "ăn gì khi bị bệnh tim", "thực đơn cho bệnh tim", "kiêng ăn bệnh tim"],
        "response": "Người bệnh tim nên ăn nhiều rau xanh, trái cây, cá, hạn chế muối, đường, mỡ động vật, tránh thực phẩm chế biến sẵn. Uống đủ nước, hạn chế rượu bia."
    },
    {
        "keywords": ["tập luyện cho người bệnh tim", "tập thể dục bệnh tim", "bài tập cho bệnh tim", "vận động khi bị bệnh tim"],
        "response": "Tập luyện đều đặn giúp cải thiện sức khỏe tim mạch. Nên chọn bài tập nhẹ nhàng như đi bộ, yoga, đạp xe. Tham khảo ý kiến bác sĩ trước khi tập luyện."
    },
    {
        "keywords": ["khi nào đi khám bác sĩ tim mạch", "dấu hiệu cần đi khám tim", "bao lâu nên khám tim mạch", "khám định kỳ tim mạch"],
        "response": "Bạn nên đi khám bác sĩ tim mạch khi có triệu chứng đau ngực, khó thở, hồi hộp, phù chân, hoặc có yếu tố nguy cơ như tăng huyết áp, tiểu đường, cholesterol cao. Khám định kỳ 6-12 tháng/lần nếu có bệnh lý tim mạch."
    },
    {
        "keywords": ["xét nghiệm tim mạch", "siêu âm tim", "điện tâm đồ", "xét nghiệm máu tim mạch"],
        "response": "Các xét nghiệm thường dùng trong chẩn đoán bệnh tim mạch gồm: điện tâm đồ (ECG), siêu âm tim, xét nghiệm máu (men tim, cholesterol), chụp mạch vành..."
    },
    {
        "keywords": ["đột quỵ", "tai biến mạch máu não", "phòng ngừa đột quỵ", "dấu hiệu đột quỵ"],
        "response": "Đột quỵ là tình trạng tắc hoặc vỡ mạch máu não, có thể liên quan đến bệnh tim mạch. Dấu hiệu: méo miệng, yếu liệt tay chân, nói khó. Nếu nghi ngờ, gọi cấp cứu ngay. Phòng ngừa bằng kiểm soát huyết áp, đường huyết, cholesterol, không hút thuốc."
    },
    {
        "keywords": ["chào bạn", "xin chào", "hello", "hi", "bạn khỏe không"],
        "response": "Chào bạn, tôi là trợ lý sức khỏe thông minh. Tôi có thể giúp gì cho bạn?"
    },
    {
        "keywords": ["bạn là ai", "bạn tên gì", "giới thiệu", "chatbot là gì"],
        "response": "Tôi là một chatbot được thiết kế để cung cấp thông tin về sức khỏe tim mạch và hỗ trợ bạn trên nền tảng HealthSmart."
    },
    {
        "keywords": ["giờ làm việc", "làm việc khi nào", "hoạt động lúc nào", "có trực 24/7 không"],
        "response": "Tôi hoạt động 24/7. Tuy nhiên, với các trường hợp khẩn cấp, bạn nên liên hệ trực tiếp với cơ sở y tế."
    },
    {
        "keywords": ["liên hệ", "số điện thoại", "gọi cấp cứu", "hỗ trợ khẩn cấp"],
        "response": "Để được hỗ trợ khẩn cấp, vui lòng gọi 115. Để được tư vấn chuyên sâu, hãy đặt lịch với bác sĩ của bạn."
    },
    {
        "keywords": ["cảm ơn", "thanks", "thank you", "biết ơn"],
        "response": "Rất vui được giúp bạn! Nếu có câu hỏi khác, đừng ngần ngại hỏi nhé."
    },
    {
        "keywords": ["triệu chứng", "dấu hiệu bệnh tim", "biểu hiện bệnh tim", "bệnh tim có triệu chứng gì"],
        "response": "Các triệu chứng phổ biến của bệnh tim mạch bao gồm đau ngực, khó thở, mệt mỏi, và phù chân. Tuy nhiên, để có chẩn đoán chính xác, bạn nên tham khảo ý kiến bác sĩ."
    },
    {
        "keywords": ["phòng ngừa", "ngăn ngừa bệnh tim", "cách phòng bệnh tim", "phòng bệnh tim mạch"],
        "response": "Để phòng ngừa bệnh tim mạch, bạn nên duy trì một lối sống lành mạnh: ăn uống cân bằng, tập thể dục thường xuyên, không hút thuốc, và kiểm soát căng thẳng."
    },
    {
        "keywords": ["tăng huyết áp", "cao huyết áp", "huyết áp cao", "kiểm tra huyết áp"],
        "response": "Tăng huyết áp là một yếu tố nguy cơ chính của bệnh tim mạch. Bạn nên kiểm tra huyết áp thường xuyên và tuân thủ chỉ định của bác sĩ nếu có."
    },
    {
        "keywords": ["thuốc tim mạch", "uống thuốc", "quên uống thuốc", "tác dụng phụ thuốc"],
        "response": "Việc dùng thuốc tim mạch cần tuân thủ chỉ định của bác sĩ. Nếu bạn quên uống thuốc hoặc gặp tác dụng phụ, hãy liên hệ bác sĩ để được tư vấn."
    },
    {
        "keywords": ["chế độ ăn", "ăn uống cho người bệnh tim", "thực đơn cho tim mạch", "ăn gì tốt cho tim"],
        "response": "Chế độ ăn cho người bệnh tim nên nhiều rau xanh, trái cây, hạn chế muối, đường, chất béo bão hòa và tránh thực phẩm chế biến sẵn."
    },
    {
        "keywords": ["tập thể dục", "vận động", "tập luyện cho tim mạch", "bài tập cho người bệnh tim"],
        "response": "Tập thể dục đều đặn giúp cải thiện sức khỏe tim mạch. Hãy tham khảo ý kiến bác sĩ trước khi bắt đầu chương trình tập luyện mới."
    },
    {
        "keywords": ["stress", "căng thẳng", "giảm stress", "kiểm soát căng thẳng"],
        "response": "Kiểm soát stress là yếu tố quan trọng để bảo vệ sức khỏe tim mạch. Bạn có thể thử thiền, yoga, hoặc các hoạt động thư giãn."
    },
    {
        "keywords": ["hướng dẫn sử dụng", "cách dùng healthsmart", "cách sử dụng nền tảng", "hỗ trợ sử dụng"],
        "response": "Bạn có thể truy cập mục Hướng dẫn trên nền tảng HealthSmart hoặc hỏi tôi về các chức năng cụ thể để được hỗ trợ."
    },
    {
        "keywords": ["đặt lịch khám", "đăng ký khám", "lịch khám bệnh", "đặt lịch với bác sĩ"],
        "response": "Để đặt lịch khám, bạn có thể sử dụng chức năng Đặt lịch trên nền tảng hoặc liên hệ trực tiếp với cơ sở y tế."
    },
    {
        "keywords": ["bmi", "chỉ số bmi", "tính bmi", "chỉ số khối cơ thể"],
        "response": "Chỉ số BMI = cân nặng (kg) / (chiều cao (m))^2. BMI từ 18.5-24.9 là bình thường. Nếu bạn cần tính toán, hãy cung cấp cân nặng và chiều cao của bạn."
    },
    {
        "keywords": ["cholesterol", "mỡ máu", "kiểm tra cholesterol", "giảm cholesterol"],
        "response": "Cholesterol cao là yếu tố nguy cơ bệnh tim mạch. Bạn nên kiểm tra định kỳ và duy trì chế độ ăn lành mạnh, tập thể dục thường xuyên."
    },
    {
        "keywords": ["đường huyết", "tiểu đường", "kiểm tra đường huyết", "đường máu cao"],
        "response": "Đường huyết cao có thể ảnh hưởng đến tim mạch. Hãy kiểm tra đường huyết định kỳ và tuân thủ hướng dẫn của bác sĩ."
    },
    {
        "keywords": ["ngưng tim", "ngừng tim", "hồi sức tim phổi", "cấp cứu ngưng tim"],
        "response": "Nếu gặp trường hợp ngưng tim, hãy gọi cấp cứu 115 ngay lập tức và thực hiện hồi sức tim phổi (CPR) nếu có thể."
    },
    {
        "keywords": ["đau đầu", "chóng mặt", "hoa mắt", "mệt mỏi"],
        "response": "Các triệu chứng này có thể liên quan đến nhiều nguyên nhân, bao gồm cả bệnh tim mạch. Nếu kéo dài hoặc nặng lên, hãy đi khám bác sĩ."
    },
    {
        "keywords": ["khó thở", "thở gấp", "thở hụt hơi", "khó thở khi nằm"],
        "response": "Khó thở là triệu chứng cần chú ý. Nếu xuất hiện đột ngột hoặc nặng lên, hãy liên hệ bác sĩ hoặc gọi cấp cứu."
    },
]


def get_rule_based_response(message: str) -> str | None:
    """
    Checks if the message matches any predefined rule (case-insensitive, multi-keyword, normalize text).
    Returns the corresponding response or None if no match is found.
    """
    normalized_message = normalize_text(message)
    for rule in RULES:
        for keyword in rule["keywords"]:
            if normalize_text(keyword) in normalized_message:
                return rule["response"]
    return None