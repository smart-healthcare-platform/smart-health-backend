package fit.iuh.billing.services.receptionist.impl;

import fit.iuh.billing.dto.receptionist.DailyStatisticsDTO;
import fit.iuh.billing.entity.Payment;
import fit.iuh.billing.enums.PaymentMethodType;
import fit.iuh.billing.enums.PaymentStatus;
import fit.iuh.billing.enums.PaymentType;
import fit.iuh.billing.repository.PaymentRepository;
import fit.iuh.billing.services.receptionist.ReceptionistBillingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Implementation of ReceptionistBillingService
 * Provides daily payment statistics for receptionist dashboard
 * 
 * @author Smart Health Team
 * @version 1.0
 */
@Service
public class ReceptionistBillingServiceImpl implements ReceptionistBillingService {

    private static final Logger logger = LoggerFactory.getLogger(ReceptionistBillingServiceImpl.class);

    @Autowired
    private PaymentRepository paymentRepository;

    @Override
    public DailyStatisticsDTO getDailyStatistics(LocalDate date) {
        logger.info("Calculating daily statistics for date: {}", date);
        
        try {
            // Define date range for the day
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.atTime(LocalTime.MAX);
            
            // Get all completed payments for the day
            List<Payment> completedPayments = paymentRepository.findCompletedPaymentsByDateRange(startOfDay, endOfDay);
            
            // Get pending/processing payments
            List<Payment> pendingPayments = paymentRepository.findByStatusAndDateRange(
                PaymentStatus.PENDING, startOfDay, endOfDay
            );
            List<Payment> processingPayments = paymentRepository.findByStatusAndDateRange(
                PaymentStatus.PROCESSING, startOfDay, endOfDay
            );
            
            // Get failed payments
            List<Payment> failedPayments = paymentRepository.findByStatusAndDateRange(
                PaymentStatus.FAILED, startOfDay, endOfDay
            );
            
            // Calculate total revenue
            BigDecimal totalRevenue = completedPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Calculate transactions counts
            long totalTransactions = completedPayments.size();
            long pendingTransactions = pendingPayments.size() + processingPayments.size();
            long failedTransactions = failedPayments.size();
            
            // Calculate average transaction amount
            BigDecimal averageAmount = totalTransactions > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalTransactions), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
            
            // Calculate breakdown by payment type
            List<DailyStatisticsDTO.PaymentTypeBreakdown> paymentTypeBreakdown = 
                calculatePaymentTypeBreakdown(completedPayments, totalRevenue);
            
            // Calculate breakdown by payment method
            List<DailyStatisticsDTO.PaymentMethodBreakdown> paymentMethodBreakdown = 
                calculatePaymentMethodBreakdown(completedPayments, totalRevenue);
            
            // Calculate cash vs online revenue
            BigDecimal cashRevenue = completedPayments.stream()
                .filter(p -> p.getPaymentMethod() == PaymentMethodType.CASH)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal onlineRevenue = completedPayments.stream()
                .filter(p -> p.getPaymentMethod() == PaymentMethodType.MOMO || 
                            p.getPaymentMethod() == PaymentMethodType.VNPAY)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            return DailyStatisticsDTO.builder()
                .date(date)
                .totalRevenue(totalRevenue)
                .totalTransactions(totalTransactions)
                .pendingTransactions(pendingTransactions)
                .failedTransactions(failedTransactions)
                .paymentTypeBreakdown(paymentTypeBreakdown)
                .paymentMethodBreakdown(paymentMethodBreakdown)
                .cashRevenue(cashRevenue)
                .onlineRevenue(onlineRevenue)
                .averageTransactionAmount(averageAmount)
                .build();
                
        } catch (Exception e) {
            logger.error("Error calculating daily statistics for date: {}", date, e);
            // Return empty statistics on error
            return DailyStatisticsDTO.builder()
                .date(date)
                .totalRevenue(BigDecimal.ZERO)
                .totalTransactions(0L)
                .pendingTransactions(0L)
                .failedTransactions(0L)
                .paymentTypeBreakdown(new ArrayList<>())
                .paymentMethodBreakdown(new ArrayList<>())
                .cashRevenue(BigDecimal.ZERO)
                .onlineRevenue(BigDecimal.ZERO)
                .averageTransactionAmount(BigDecimal.ZERO)
                .build();
        }
    }
    
    /**
     * Calculate breakdown by payment type
     */
    private List<DailyStatisticsDTO.PaymentTypeBreakdown> calculatePaymentTypeBreakdown(
            List<Payment> payments, BigDecimal totalRevenue) {
        
        Map<PaymentType, BigDecimal> revenueByType = new EnumMap<>(PaymentType.class);
        Map<PaymentType, Long> countByType = new EnumMap<>(PaymentType.class);
        
        // Initialize all payment types
        for (PaymentType type : PaymentType.values()) {
            revenueByType.put(type, BigDecimal.ZERO);
            countByType.put(type, 0L);
        }
        
        // Aggregate data
        for (Payment payment : payments) {
            PaymentType type = payment.getPaymentType();
            revenueByType.put(type, revenueByType.get(type).add(payment.getAmount()));
            countByType.put(type, countByType.get(type) + 1);
        }
        
        // Build breakdown list
        List<DailyStatisticsDTO.PaymentTypeBreakdown> breakdown = new ArrayList<>();
        for (PaymentType type : PaymentType.values()) {
            BigDecimal revenue = revenueByType.get(type);
            Long count = countByType.get(type);
            
            // Only include types with transactions
            if (count > 0) {
                double percentage = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? revenue.divide(totalRevenue, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP)
                        .doubleValue()
                    : 0.0;
                
                breakdown.add(DailyStatisticsDTO.PaymentTypeBreakdown.builder()
                    .paymentType(type.name())
                    .revenue(revenue)
                    .transactionCount(count)
                    .percentage(percentage)
                    .build());
            }
        }
        
        return breakdown;
    }
    
    /**
     * Calculate breakdown by payment method
     */
    private List<DailyStatisticsDTO.PaymentMethodBreakdown> calculatePaymentMethodBreakdown(
            List<Payment> payments, BigDecimal totalRevenue) {
        
        Map<PaymentMethodType, BigDecimal> revenueByMethod = new EnumMap<>(PaymentMethodType.class);
        Map<PaymentMethodType, Long> countByMethod = new EnumMap<>(PaymentMethodType.class);
        
        // Initialize all payment methods
        for (PaymentMethodType method : PaymentMethodType.values()) {
            revenueByMethod.put(method, BigDecimal.ZERO);
            countByMethod.put(method, 0L);
        }
        
        // Aggregate data
        for (Payment payment : payments) {
            PaymentMethodType method = payment.getPaymentMethod();
            revenueByMethod.put(method, revenueByMethod.get(method).add(payment.getAmount()));
            countByMethod.put(method, countByMethod.get(method) + 1);
        }
        
        // Build breakdown list
        List<DailyStatisticsDTO.PaymentMethodBreakdown> breakdown = new ArrayList<>();
        for (PaymentMethodType method : PaymentMethodType.values()) {
            BigDecimal revenue = revenueByMethod.get(method);
            Long count = countByMethod.get(method);
            
            // Only include methods with transactions
            if (count > 0) {
                double percentage = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? revenue.divide(totalRevenue, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP)
                        .doubleValue()
                    : 0.0;
                
                breakdown.add(DailyStatisticsDTO.PaymentMethodBreakdown.builder()
                    .paymentMethod(method.name())
                    .revenue(revenue)
                    .transactionCount(count)
                    .percentage(percentage)
                    .build());
            }
        }
        
        return breakdown;
    }
}