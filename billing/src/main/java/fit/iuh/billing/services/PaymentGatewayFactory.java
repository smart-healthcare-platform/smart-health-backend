package fit.iuh.billing.services;

import fit.iuh.billing.enums.PaymentMethodType;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class PaymentGatewayFactory {

    private final Map<PaymentMethodType, PaymentGatewayService> gatewayServiceMap;

    public PaymentGatewayFactory(Map<String, PaymentGatewayService> services) {
        this.gatewayServiceMap = services.entrySet().stream()
                .collect(Collectors.toMap(
                        entry -> {
                            if (entry.getKey().toLowerCase().contains("momo")) {
                                return PaymentMethodType.MOMO;
                            } else if (entry.getKey().toLowerCase().contains("vnpay")) {
                                return PaymentMethodType.VNPAY;
                            } else {
                                return PaymentMethodType.CASH;
                            }
                        },
                        Map.Entry::getValue
                ));
    }

    public PaymentGatewayService getGatewayService(PaymentMethodType type) {
        return Optional.ofNullable(gatewayServiceMap.get(type))
                .orElseThrow(() -> new IllegalArgumentException("Unsupported payment method type: " + type));
    }
}