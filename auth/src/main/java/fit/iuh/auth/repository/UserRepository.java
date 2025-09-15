package fit.iuh.auth.repository;

import fit.iuh.auth.entity.User;
import fit.iuh.auth.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    Optional<User> findByUsername(String username);
    
    boolean existsByUsername(String username);
    Optional<User> findByEmail(String email);

    // Thêm phương thức kiểm tra email đã tồn tại chưa
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    
    List<User> findByIsActive(Boolean isActive);
    
    Optional<User> findByUsernameAndIsActive(String username, Boolean isActive);
} 