package fit.iuh.auth.service;

import fit.iuh.auth.dto.request.LoginRequest;
import fit.iuh.auth.dto.request.RegisterRequest;
import fit.iuh.auth.dto.request.RegisterByReceptionistRequest;
import fit.iuh.auth.dto.request.UserCreatedEvent;
import fit.iuh.auth.dto.response.AuthResponse;
import fit.iuh.auth.dto.response.ReceptionistRegisterResponse;
import fit.iuh.auth.entity.RefreshToken;
import fit.iuh.auth.entity.User;
import fit.iuh.auth.enums.Role;
import fit.iuh.auth.kafka.UserProducer;
import fit.iuh.auth.repository.RefreshTokenRepository;
import fit.iuh.auth.repository.UserRepository;
import fit.iuh.auth.util.UsernameGenerator;
import fit.iuh.auth.util.PasswordGenerator;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.juli.logging.Log;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    @Value("${server.ssl.enabled:false}")
    private boolean sslEnabled;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserProducer userProducer;

    public AuthResponse register(RegisterRequest request, HttpServletResponse response) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Username đã tồn tại: " + request.getEmail());
        }
        String generatedUsername = UsernameGenerator.generateUsername(request.getFullName(), request.getDateOfBirth());

        String finalUsername = generatedUsername;
        int counter = 1;
        while (userRepository.existsByUsername(finalUsername)) {
            finalUsername = generatedUsername + "_" + counter;
            counter++;
        }
        User user = new User();
        user.setUsername(finalUsername);
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.PATIENT);
        user.setIsActive(true);


        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", savedUser.getUsername());
        if (savedUser.getRole() == Role.PATIENT) {
            UserCreatedEvent event = new UserCreatedEvent(
                    savedUser.getId().toString(),
                    request.getFullName(),
                    request.getDateOfBirth().toString(),
                    request.getGender(),
                    request.getAddress(),
                    request.getPhone()
            );
            userProducer.sendUserCreated(event);
        }
        // Tạo payload chứa role & authorities
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", savedUser.getRole().name()); // Convert enum to string
        claims.put("authorities", savedUser.getAuthorities());
        claims.put("id", savedUser.getId());

        String jwtToken = jwtService.generateToken(claims, savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser);

        saveRefreshToken(savedUser, refreshToken, LocalDateTime.now().plusDays(7));
        setRefreshTokenCookie(response, refreshToken);

        return AuthResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .user(AuthResponse.UserInfo.builder()
                        .id(savedUser.getId())
                        .username(savedUser.getUsername())
                        .role(savedUser.getRole())
                        .createdAt(savedUser.getCreatedAt())
                        .build())
                .build();
    }

    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        log.info("Attempting to login user: {}", request.getEmail());

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getIsActive()) {
            throw new RuntimeException("Tài khoản đã bị vô hiệu hóa");
        }

        log.info("User logged in successfully: {}", user.getUsername());

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name()); // Convert enum to string
        claims.put("authorities", user.getAuthorities());
        claims.put("id", user.getId());

        String jwtToken = jwtService.generateToken(claims, user);
        String refreshToken = jwtService.generateRefreshToken(user);

        refreshTokenRepository.deleteByUserId(user.getId());
        saveRefreshToken(user, refreshToken, LocalDateTime.now().plusDays(7));
        setRefreshTokenCookie(response, refreshToken);

        return AuthResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .role(user.getRole())
                        .email(user.getEmail())
                        .createdAt(user.getCreatedAt())
                        .build())
                .build();
    }

    public AuthResponse refreshToken(String refreshToken, HttpServletResponse response) {
        log.info("Attempting to refresh token");

        String username = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!jwtService.isTokenValid(refreshToken, user)) {
            throw new RuntimeException("Invalid refresh token");
        }

        // Check if refresh token exists in database and is not expired
        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));
        if (storedToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(storedToken);
            throw new RuntimeException("Refresh token expired");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name()); // Convert enum to string
        claims.put("authorities", user.getAuthorities());
        claims.put("id", user.getId());

        String newJwtToken = jwtService.generateToken(claims, user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        refreshTokenRepository.deleteByUserId(user.getId());
        saveRefreshToken(user, newRefreshToken, LocalDateTime.now().plusDays(7));
        setRefreshTokenCookie(response, newRefreshToken);

        return AuthResponse.builder()
                .token(newJwtToken)
                .refreshToken(newRefreshToken)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .role(user.getRole())
                        .email(user.getEmail())
                        .createdAt(user.getCreatedAt())
                        .build())
                .build();
    }

    private void saveRefreshToken(User user, String token, LocalDateTime expiryDate) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(token);
        refreshToken.setExpiryDate(expiryDate);
        refreshTokenRepository.save(refreshToken);
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie("refreshToken", refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(sslEnabled);
        cookie.setDomain("localhost");
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60);
        response.addCookie(cookie);
    }

    public void logout(HttpServletResponse response, String refreshToken) {
        log.info("Logging out user with refreshToken: {}", refreshToken);
        refreshTokenRepository.deleteByToken(refreshToken);

        Cookie cookie = new Cookie("refreshToken", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(sslEnabled);
        cookie.setDomain("localhost");
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    //Seeder data
    public User registerUser(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại: " + request.getEmail());
        }

        String generatedUsername = UsernameGenerator.generateUsername(request.getFullName(), request.getDateOfBirth());
        String finalUsername = generatedUsername;
        int counter = 1;
        while (userRepository.existsByUsername(finalUsername)) {
            finalUsername = generatedUsername + "_" + counter;
            counter++;
        }

        User user = new User();
        user.setUsername(finalUsername);
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.PATIENT);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        if (savedUser.getRole() == Role.PATIENT) {
            UserCreatedEvent event = new UserCreatedEvent(
                    savedUser.getId().toString(),
                    request.getFullName(),
                    request.getDateOfBirth(),
                    request.getGender(),
                    request.getAddress(),
                    request.getPhone()
            );
            userProducer.sendUserCreated(event);
        }

        return savedUser;
    }

    /**
     * Register walk-in patient by receptionist
     * Auto-generates username and temporary password
     * Sends event to Patient service via Kafka
     * 
     * @param request Registration data from receptionist
     * @return ReceptionistRegisterResponse with user info and temporary password
     */
    public ReceptionistRegisterResponse registerByReceptionist(RegisterByReceptionistRequest request) {
        log.info("Starting walk-in patient registration - email: {}, phone: {}", 
                request.getEmail(), request.getPhone());

        // Validate unique email and phone
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại trong hệ thống: " + request.getEmail());
        }

        // Generate username from full name and date of birth
        String generatedUsername = UsernameGenerator.generateUsername(
                request.getFullName(), 
                request.getDateOfBirth()
        );
        
        // Ensure username is unique
        String finalUsername = generatedUsername;
        int counter = 1;
        while (userRepository.existsByUsername(finalUsername)) {
            finalUsername = generatedUsername + "_" + counter;
            counter++;
        }

        // Generate temporary password
        String temporaryPassword = PasswordGenerator.generateTemporaryPassword();
        
        // Create user entity
        User user = new User();
        user.setUsername(finalUsername);
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        user.setRole(Role.PATIENT);
        user.setIsActive(true);

        // Save user to database
        User savedUser = userRepository.save(user);
        log.info("Walk-in patient user created - userId: {}, username: {}", 
                savedUser.getId(), savedUser.getUsername());

        // Send event to Patient service to create patient profile
        UserCreatedEvent event = new UserCreatedEvent(
                savedUser.getId().toString(),
                request.getFullName(),
                request.getDateOfBirth(),
                request.getGender(),
                request.getAddress(),
                request.getPhone()
        );
        userProducer.sendUserCreated(event);
        log.info("UserCreatedEvent sent to Patient service for userId: {}", savedUser.getId());

        // Build response with temporary password
        return ReceptionistRegisterResponse.builder()
                .user(ReceptionistRegisterResponse.UserInfo.builder()
                        .id(savedUser.getId())
                        .username(savedUser.getUsername())
                        .email(savedUser.getEmail())
                        .fullName(request.getFullName())
                        .role(savedUser.getRole())
                        .createdAt(savedUser.getCreatedAt())
                        .build())
                .temporaryPassword(temporaryPassword)
                .patientId(null) // Will be populated after Patient service processes event
                .message("Tài khoản đã được tạo. Vui lòng cung cấp mật khẩu tạm thời cho bệnh nhân.")
                .build();
    }

}
