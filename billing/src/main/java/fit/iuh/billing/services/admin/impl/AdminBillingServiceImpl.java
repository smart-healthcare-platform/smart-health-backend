package fit.iuh.billing.services.admin.impl;

import fit.iuh.billing.dto.admin.*;
import fit.iuh.billing.entity.Payment;
import fit.iuh.billing.enums.PaymentMethodType;
import fit.iuh.billing.enums.PaymentStatus;
import fit.iuh.billing.enums.PaymentType;
import fit.iuh.billing.repository.PaymentRepository;
import fit.iuh.billing.services.admin.AdminBillingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of AdminBillingService
 * Provides comprehensive statistics and analytics for admin dashboard
 */
@Service
public class AdminBillingServiceImpl implements AdminBillingService {

    private static final Logger logger = LoggerFactory.getLogger(AdminBillingServiceImpl.class);
    
    @Autowired
    private PaymentRepository paymentRepository;

    @Override
    public RevenueStatsDTO getRevenueStats() {
        logger.info("Calculating revenue statistics");
        
        try {
            // Get current date boundaries
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
            LocalDateTime todayEnd = now.toLocalDate().atTime(LocalTime.MAX);
            
            LocalDateTime monthStart = now.toLocalDate().withDayOfMonth(1).atStartOfDay();
            LocalDateTime monthEnd = now.toLocalDate().withDayOfMonth(now.toLocalDate().lengthOfMonth()).atTime(LocalTime.MAX);
            
            LocalDateTime yearStart = now.toLocalDate().withDayOfYear(1).atStartOfDay();
            LocalDateTime yearEnd = now.toLocalDate().withDayOfYear(now.toLocalDate().lengthOfYear()).atTime(LocalTime.MAX);
            
            // Calculate revenue
            BigDecimal totalRevenue = paymentRepository.sumAmountByStatus(PaymentStatus.COMPLETED);
            BigDecimal todayRevenue = paymentRepository.sumAmountByDateRange(todayStart, todayEnd);
            BigDecimal monthRevenue = paymentRepository.sumAmountByDateRange(monthStart, monthEnd);
            BigDecimal yearRevenue = paymentRepository.sumAmountByDateRange(yearStart, yearEnd);
            
            // Calculate payment counts
            long totalPayments = paymentRepository.count();
            long completedPayments = paymentRepository.countByStatus(PaymentStatus.COMPLETED);
            long pendingPayments = paymentRepository.countByStatus(PaymentStatus.PENDING) + 
                                   paymentRepository.countByStatus(PaymentStatus.PROCESSING);
            long failedPayments = paymentRepository.countByStatus(PaymentStatus.FAILED);
            
            // Calculate average
            BigDecimal averagePaymentAmount = paymentRepository.getAveragePaymentAmount();
            
            // Calculate completion rate
            double completionRate = totalPayments > 0 
                ? (completedPayments * 100.0 / totalPayments) 
                : 0.0;
            
            // Calculate growth rates (compared to previous month)
            LocalDateTime prevMonthStart = monthStart.minusMonths(1);
            LocalDateTime prevMonthEnd = monthStart.minusDays(1).toLocalDate().atTime(LocalTime.MAX);
            BigDecimal prevMonthRevenue = paymentRepository.sumAmountByDateRange(prevMonthStart, prevMonthEnd);
            long prevMonthPayments = paymentRepository.countByDateRange(prevMonthStart, prevMonthEnd);
            
            double revenueGrowthRate = calculateGrowthRate(prevMonthRevenue, monthRevenue);
            double paymentGrowthRate = calculateGrowthRate(
                BigDecimal.valueOf(prevMonthPayments), 
                BigDecimal.valueOf(paymentRepository.countByDateRange(monthStart, monthEnd))
            );
            
            return RevenueStatsDTO.builder()
                .totalRevenue(totalRevenue)
                .todayRevenue(todayRevenue)
                .monthRevenue(monthRevenue)
                .yearRevenue(yearRevenue)
                .totalPayments(totalPayments)
                .completedPayments(completedPayments)
                .pendingPayments(pendingPayments)
                .failedPayments(failedPayments)
                .averagePaymentAmount(averagePaymentAmount)
                .completionRate(roundToTwoDecimals(completionRate))
                .revenueGrowthRate(roundToTwoDecimals(revenueGrowthRate))
                .paymentGrowthRate(roundToTwoDecimals(paymentGrowthRate))
                .build();
                
        } catch (Exception e) {
            logger.error("Error calculating revenue stats", e);
            // Return empty stats on error
            return RevenueStatsDTO.builder()
                .totalRevenue(BigDecimal.ZERO)
                .todayRevenue(BigDecimal.ZERO)
                .monthRevenue(BigDecimal.ZERO)
                .yearRevenue(BigDecimal.ZERO)
                .totalPayments(0L)
                .completedPayments(0L)
                .pendingPayments(0L)
                .failedPayments(0L)
                .averagePaymentAmount(BigDecimal.ZERO)
                .completionRate(0.0)
                .revenueGrowthRate(0.0)
                .paymentGrowthRate(0.0)
                .build();
        }
    }

    @Override
    public RevenueDistributionDTO getRevenueDistribution() {
        logger.info("Calculating revenue distribution");
        
        try {
            // Get all payments
            List<Payment> allPayments = paymentRepository.findAll();
            List<Payment> completedPayments = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .collect(Collectors.toList());
            
            BigDecimal totalRevenue = completedPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Calculate distribution by payment method
            List<RevenueDistributionDTO.PaymentMethodDistribution> methodDistribution = 
                Arrays.stream(PaymentMethodType.values())
                    .map(method -> {
                        List<Payment> methodPayments = completedPayments.stream()
                            .filter(p -> p.getPaymentMethod() == method)
                            .collect(Collectors.toList());
                        
                        BigDecimal methodAmount = methodPayments.stream()
                            .map(Payment::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                        
                        double percentage = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                            ? methodAmount.multiply(BigDecimal.valueOf(100))
                                .divide(totalRevenue, 2, RoundingMode.HALF_UP)
                                .doubleValue()
                            : 0.0;
                        
                        return RevenueDistributionDTO.PaymentMethodDistribution.builder()
                            .method(method.name())
                            .count((long) methodPayments.size())
                            .amount(methodAmount)
                            .percentage(roundToTwoDecimals(percentage))
                            .build();
                    })
                    .collect(Collectors.toList());
            
            // Calculate distribution by payment type
            List<RevenueDistributionDTO.PaymentTypeDistribution> typeDistribution = 
                Arrays.stream(PaymentType.values())
                    .filter(type -> type != PaymentType.PRESCRIPTION) // Exclude deprecated
                    .map(type -> {
                        List<Payment> typePayments = completedPayments.stream()
                            .filter(p -> p.getPaymentType() == type)
                            .collect(Collectors.toList());
                        
                        BigDecimal typeAmount = typePayments.stream()
                            .map(Payment::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                        
                        double percentage = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                            ? typeAmount.multiply(BigDecimal.valueOf(100))
                                .divide(totalRevenue, 2, RoundingMode.HALF_UP)
                                .doubleValue()
                            : 0.0;
                        
                        return RevenueDistributionDTO.PaymentTypeDistribution.builder()
                            .type(type.name())
                            .count((long) typePayments.size())
                            .amount(typeAmount)
                            .percentage(roundToTwoDecimals(percentage))
                            .build();
                    })
                    .collect(Collectors.toList());
            
            // Calculate distribution by status
            BigDecimal totalAmount = allPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            List<RevenueDistributionDTO.PaymentStatusDistribution> statusDistribution = 
                Arrays.stream(PaymentStatus.values())
                    .map(status -> {
                        List<Payment> statusPayments = allPayments.stream()
                            .filter(p -> p.getStatus() == status)
                            .collect(Collectors.toList());
                        
                        BigDecimal statusAmount = statusPayments.stream()
                            .map(Payment::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                        
                        double percentage = totalAmount.compareTo(BigDecimal.ZERO) > 0
                            ? statusAmount.multiply(BigDecimal.valueOf(100))
                                .divide(totalAmount, 2, RoundingMode.HALF_UP)
                                .doubleValue()
                            : 0.0;
                        
                        return RevenueDistributionDTO.PaymentStatusDistribution.builder()
                            .status(status.name())
                            .count((long) statusPayments.size())
                            .amount(statusAmount)
                            .percentage(roundToTwoDecimals(percentage))
                            .build();
                    })
                    .collect(Collectors.toList());
            
            return RevenueDistributionDTO.builder()
                .byPaymentMethod(methodDistribution)
                .byPaymentType(typeDistribution)
                .byStatus(statusDistribution)
                .build();
                
        } catch (Exception e) {
            logger.error("Error calculating revenue distribution", e);
            return RevenueDistributionDTO.builder()
                .byPaymentMethod(Collections.emptyList())
                .byPaymentType(Collections.emptyList())
                .byStatus(Collections.emptyList())
                .build();
        }
    }

    @Override
    public RevenueTrendDTO getRevenueTrends(String period, Integer days) {
        logger.info("Calculating revenue trends for period: {}, days: {}", period, days);
        
        try {
            // Default to 30 days if not specified
            int lookbackDays = days != null ? days : 30;
            String periodType = period != null ? period.toUpperCase() : "DAILY";
            
            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusDays(lookbackDays - 1);
            
            LocalDateTime startDateTime = startDate.atStartOfDay();
            LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
            
            // Get all completed payments in range
            List<Payment> payments = paymentRepository.findCompletedPaymentsByDateRange(startDateTime, endDateTime);
            
            List<RevenueTrendDTO.TrendDataPoint> dataPoints = new ArrayList<>();
            
            switch (periodType) {
                case "DAILY":
                    dataPoints = calculateDailyTrends(payments, startDate, endDate);
                    break;
                case "WEEKLY":
                    dataPoints = calculateWeeklyTrends(payments, startDate, endDate);
                    break;
                case "MONTHLY":
                    dataPoints = calculateMonthlyTrends(payments, startDate, endDate);
                    break;
                case "YEARLY":
                    dataPoints = calculateYearlyTrends(payments);
                    break;
                default:
                    dataPoints = calculateDailyTrends(payments, startDate, endDate);
            }
            
            return RevenueTrendDTO.builder()
                .period(periodType)
                .startDate(startDate)
                .endDate(endDate)
                .data(dataPoints)
                .build();
                
        } catch (Exception e) {
            logger.error("Error calculating revenue trends", e);
            return RevenueTrendDTO.builder()
                .period(period)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now())
                .data(Collections.emptyList())
                .build();
        }
    }

    @Override
    public PaymentMethodStatsDTO getPaymentMethodStats() {
        logger.info("Calculating payment method statistics");
        
        try {
            List<Payment> allPayments = paymentRepository.findAll();
            long totalTransactions = allPayments.size();
            
            BigDecimal totalRevenue = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            List<PaymentMethodStatsDTO.MethodStats> methodStatsList = 
                Arrays.stream(PaymentMethodType.values())
                    .map(method -> {
                        List<Payment> methodPayments = allPayments.stream()
                            .filter(p -> p.getPaymentMethod() == method)
                            .collect(Collectors.toList());
                        
                        long methodTotal = methodPayments.size();
                        long methodSuccess = methodPayments.stream()
                            .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                            .count();
                        long methodFailed = methodPayments.stream()
                            .filter(p -> p.getStatus() == PaymentStatus.FAILED)
                            .count();
                        long methodPending = methodPayments.stream()
                            .filter(p -> p.getStatus() == PaymentStatus.PENDING || 
                                        p.getStatus() == PaymentStatus.PROCESSING)
                            .count();
                        
                        BigDecimal methodRevenue = methodPayments.stream()
                            .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                            .map(Payment::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                        
                        BigDecimal avgAmount = methodSuccess > 0
                            ? methodRevenue.divide(BigDecimal.valueOf(methodSuccess), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                        
                        double successRate = methodTotal > 0
                            ? (methodSuccess * 100.0 / methodTotal)
                            : 0.0;
                        
                        double revenuePercentage = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                            ? methodRevenue.multiply(BigDecimal.valueOf(100))
                                .divide(totalRevenue, 2, RoundingMode.HALF_UP)
                                .doubleValue()
                            : 0.0;
                        
                        double usagePercentage = totalTransactions > 0
                            ? (methodTotal * 100.0 / totalTransactions)
                            : 0.0;
                        
                        return PaymentMethodStatsDTO.MethodStats.builder()
                            .method(method.name())
                            .totalTransactions(methodTotal)
                            .successfulTransactions(methodSuccess)
                            .failedTransactions(methodFailed)
                            .pendingTransactions(methodPending)
                            .totalRevenue(methodRevenue)
                            .averageTransactionAmount(avgAmount)
                            .successRate(roundToTwoDecimals(successRate))
                            .revenuePercentage(roundToTwoDecimals(revenuePercentage))
                            .usagePercentage(roundToTwoDecimals(usagePercentage))
                            .build();
                    })
                    .collect(Collectors.toList());
            
            // Find most used method (by transaction count)
            String mostUsedMethod = methodStatsList.stream()
                .max(Comparator.comparing(PaymentMethodStatsDTO.MethodStats::getTotalTransactions))
                .map(PaymentMethodStatsDTO.MethodStats::getMethod)
                .orElse("NONE");
            
            // Find highest revenue method
            String highestRevenueMethod = methodStatsList.stream()
                .max(Comparator.comparing(PaymentMethodStatsDTO.MethodStats::getTotalRevenue))
                .map(PaymentMethodStatsDTO.MethodStats::getMethod)
                .orElse("NONE");
            
            return PaymentMethodStatsDTO.builder()
                .methods(methodStatsList)
                .mostUsedMethod(mostUsedMethod)
                .highestRevenueMethod(highestRevenueMethod)
                .build();
                
        } catch (Exception e) {
            logger.error("Error calculating payment method stats", e);
            return PaymentMethodStatsDTO.builder()
                .methods(Collections.emptyList())
                .mostUsedMethod("NONE")
                .highestRevenueMethod("NONE")
                .build();
        }
    }
    
    // ===== Helper Methods =====
    
    private List<RevenueTrendDTO.TrendDataPoint> calculateDailyTrends(
            List<Payment> payments, LocalDate startDate, LocalDate endDate) {
        
        Map<LocalDate, List<Payment>> paymentsByDate = payments.stream()
            .collect(Collectors.groupingBy(p -> p.getPaidAt().toLocalDate()));
        
        List<RevenueTrendDTO.TrendDataPoint> dataPoints = new ArrayList<>();
        LocalDate currentDate = startDate;
        
        while (!currentDate.isAfter(endDate)) {
            List<Payment> dayPayments = paymentsByDate.getOrDefault(currentDate, Collections.emptyList());
            
            BigDecimal dayRevenue = dayPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal avgAmount = !dayPayments.isEmpty()
                ? dayRevenue.divide(BigDecimal.valueOf(dayPayments.size()), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
            
            dataPoints.add(RevenueTrendDTO.TrendDataPoint.builder()
                .label(currentDate.format(DateTimeFormatter.ofPattern("dd/MM")))
                .date(currentDate)
                .revenue(dayRevenue)
                .paymentCount((long) dayPayments.size())
                .averageAmount(avgAmount)
                .build());
            
            currentDate = currentDate.plusDays(1);
        }
        
        return dataPoints;
    }
    
    private List<RevenueTrendDTO.TrendDataPoint> calculateWeeklyTrends(
            List<Payment> payments, LocalDate startDate, LocalDate endDate) {
        
        List<RevenueTrendDTO.TrendDataPoint> dataPoints = new ArrayList<>();
        LocalDate currentWeekStart = startDate;
        
        while (!currentWeekStart.isAfter(endDate)) {
            LocalDate currentWeekEnd = currentWeekStart.plusDays(6);
            if (currentWeekEnd.isAfter(endDate)) {
                currentWeekEnd = endDate;
            }
            
            final LocalDate weekStart = currentWeekStart;
            final LocalDate weekEnd = currentWeekEnd;
            
            List<Payment> weekPayments = payments.stream()
                .filter(p -> {
                    LocalDate paidDate = p.getPaidAt().toLocalDate();
                    return !paidDate.isBefore(weekStart) && !paidDate.isAfter(weekEnd);
                })
                .collect(Collectors.toList());
            
            BigDecimal weekRevenue = weekPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal avgAmount = !weekPayments.isEmpty()
                ? weekRevenue.divide(BigDecimal.valueOf(weekPayments.size()), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
            
            dataPoints.add(RevenueTrendDTO.TrendDataPoint.builder()
                .label(weekStart.format(DateTimeFormatter.ofPattern("dd/MM")) + " - " + 
                       weekEnd.format(DateTimeFormatter.ofPattern("dd/MM")))
                .date(weekStart)
                .revenue(weekRevenue)
                .paymentCount((long) weekPayments.size())
                .averageAmount(avgAmount)
                .build());
            
            currentWeekStart = currentWeekStart.plusDays(7);
        }
        
        return dataPoints;
    }
    
    private List<RevenueTrendDTO.TrendDataPoint> calculateMonthlyTrends(
            List<Payment> payments, LocalDate startDate, LocalDate endDate) {
        
        Map<String, List<Payment>> paymentsByMonth = payments.stream()
            .collect(Collectors.groupingBy(p -> 
                p.getPaidAt().format(DateTimeFormatter.ofPattern("yyyy-MM"))));
        
        List<RevenueTrendDTO.TrendDataPoint> dataPoints = new ArrayList<>();
        LocalDate currentMonth = startDate.withDayOfMonth(1);
        
        while (!currentMonth.isAfter(endDate)) {
            String monthKey = currentMonth.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            List<Payment> monthPayments = paymentsByMonth.getOrDefault(monthKey, Collections.emptyList());
            
            BigDecimal monthRevenue = monthPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal avgAmount = !monthPayments.isEmpty()
                ? monthRevenue.divide(BigDecimal.valueOf(monthPayments.size()), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
            
            dataPoints.add(RevenueTrendDTO.TrendDataPoint.builder()
                .label(currentMonth.format(DateTimeFormatter.ofPattern("MM/yyyy")))
                .date(currentMonth)
                .revenue(monthRevenue)
                .paymentCount((long) monthPayments.size())
                .averageAmount(avgAmount)
                .build());
            
            currentMonth = currentMonth.plusMonths(1);
        }
        
        return dataPoints;
    }
    
    private List<RevenueTrendDTO.TrendDataPoint> calculateYearlyTrends(List<Payment> payments) {
        Map<Integer, List<Payment>> paymentsByYear = payments.stream()
            .collect(Collectors.groupingBy(p -> p.getPaidAt().getYear()));
        
        return paymentsByYear.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(entry -> {
                List<Payment> yearPayments = entry.getValue();
                BigDecimal yearRevenue = yearPayments.stream()
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                BigDecimal avgAmount = !yearPayments.isEmpty()
                    ? yearRevenue.divide(BigDecimal.valueOf(yearPayments.size()), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
                
                return RevenueTrendDTO.TrendDataPoint.builder()
                    .label(String.valueOf(entry.getKey()))
                    .date(LocalDate.of(entry.getKey(), 1, 1))
                    .revenue(yearRevenue)
                    .paymentCount((long) yearPayments.size())
                    .averageAmount(avgAmount)
                    .build();
            })
            .collect(Collectors.toList());
    }
    
    private double calculateGrowthRate(BigDecimal previous, BigDecimal current) {
        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        
        return current.subtract(previous)
            .multiply(BigDecimal.valueOf(100))
            .divide(previous, 2, RoundingMode.HALF_UP)
            .doubleValue();
    }
    
    private double roundToTwoDecimals(double value) {
        return BigDecimal.valueOf(value)
            .setScale(2, RoundingMode.HALF_UP)
            .doubleValue();
    }
}