package com.itworx.supportdesk.config;

import com.itworx.supportdesk.entity.AuditLogEntry;
import com.itworx.supportdesk.entity.KbArticle;
import com.itworx.supportdesk.entity.Refund;
import com.itworx.supportdesk.entity.RefundStatus;
import com.itworx.supportdesk.model.Role;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.UserRole;
import com.itworx.supportdesk.repository.AuditLogRepository;
import com.itworx.supportdesk.repository.KbArticleRepository;
import com.itworx.supportdesk.repository.RefundRepository;
import com.itworx.supportdesk.repository.RoleRepository;
import com.itworx.supportdesk.repository.UserRepository;
import com.itworx.supportdesk.repository.UserRoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * Runs once on startup. Makes sure the RBAC catalog (roles table), a single
 * bootstrap admin account, the demo Knowledge Base articles, the demo
 * refund requests, and the demo audit trail entries all exist, since
 * there's no admin panel action that creates any of them from scratch yet
 * and their tables start out empty.
 *
 * Every step is idempotent (checked with existsBy... first), so this is safe
 * to run on every application start without creating duplicates or
 * clobbering real data a user has since created/decided.
 *
 * NOTE on the audit entries: 6 of the 8 seeded rows (logins, KB edits,
 * ticket escalations) don't correspond to any endpoint that actually calls
 * AuditLogService.record() yet - they're seeded as historical demo flavor
 * only, at the user's explicit request, not because the app logs those
 * actions for real. Only refund approve/reject write real rows today.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final List<String> DEFAULT_ROLES = List.of("ADMIN", "AGENT", "CUSTOMER");

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final KbArticleRepository kbArticleRepository;
    private final RefundRepository refundRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    private final String bootstrapAdminName;
    private final String bootstrapAdminEmail;
    private final String bootstrapAdminPassword;

    public DataSeeder(
            RoleRepository roleRepository,
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            KbArticleRepository kbArticleRepository,
            RefundRepository refundRepository,
            AuditLogRepository auditLogRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap-admin.name:System Admin}") String bootstrapAdminName,
            @Value("${app.bootstrap-admin.email:admin@itworx.com}") String bootstrapAdminEmail,
            @Value("${app.bootstrap-admin.password:Admin@12345}") String bootstrapAdminPassword
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.kbArticleRepository = kbArticleRepository;
        this.refundRepository = refundRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.bootstrapAdminName = bootstrapAdminName;
        this.bootstrapAdminEmail = bootstrapAdminEmail;
        this.bootstrapAdminPassword = bootstrapAdminPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        DEFAULT_ROLES.forEach(this::ensureRoleExists);
        ensureBootstrapAdminExists();
        ensureDefaultKbArticlesExist();
        ensureDefaultRefundsExist();
        ensureDefaultAuditEntriesExist();
    }

    private void ensureRoleExists(String roleName) {
        if (!roleRepository.existsByName(roleName)) {
            roleRepository.save(new Role(roleName));
            log.info("Seeded role '{}'", roleName);
        }
    }

    private void ensureBootstrapAdminExists() {
        if (userRepository.existsByEmail(bootstrapAdminEmail)) {
            return;
        }

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("ADMIN role must be seeded before the bootstrap admin"));

        User admin = new User(bootstrapAdminName, bootstrapAdminEmail, passwordEncoder.encode(bootstrapAdminPassword));
        admin = userRepository.save(admin);

        userRoleRepository.save(new UserRole(admin, adminRole));

        log.warn("Seeded bootstrap admin '{}' with the configured default password - " +
                "change it (or override app.bootstrap-admin.* / BOOTSTRAP_ADMIN_* env vars) before any shared/deployed use.",
                bootstrapAdminEmail);
    }

    private void ensureDefaultKbArticlesExist() {
        ensureKbArticleExists("Return & refund policy", "Policies", List.of("refunds", "returns"),
                "Customers can request a return or refund within 30 days of delivery for most items. " +
                        "Refunds above $200, or requests outside the 30-day window, must be escalated to an " +
                        "admin for manual approval via the Refund Approvals queue rather than auto-approved.",
                "published");

        ensureKbArticleExists("Shipping timelines by region", "Shipping", List.of("shipping"),
                "Standard shipping is 3-5 business days domestically and 7-14 business days internationally. " +
                        "Expedited shipping cuts domestic delivery to 1-2 business days. Delays are most common " +
                        "with customs clearance on international orders - set expectations accordingly.",
                "published");

        ensureKbArticleExists("Warranty claims — storage devices", "Warranty", List.of("warranty", "storage"),
                "Storage devices (SSDs, HDDs, flash drives) carry a 1-year manufacturer warranty covering " +
                        "hardware defects, not physical damage or data loss. Ask for the serial number and " +
                        "purchase date before filing a claim with the manufacturer.",
                "stale");

        ensureKbArticleExists("How to reset a customer password", "Account", List.of("account", "security"),
                "Verify the customer's identity (email + last order number or account creation date) before " +
                        "resetting anything. Send the password reset link to the email on file - never set or " +
                        "read back a password over chat or phone.",
                "draft");

        ensureKbArticleExists("Bulk order discount tiers", "Policies", List.of("orders", "pricing"),
                "Orders of 50-99 units get 5% off, 100-249 units get 10% off, and 250+ units get 15% off, " +
                        "applied automatically at checkout based on total quantity across eligible SKUs. " +
                        "Discounts don't stack with promotional codes.",
                "published");
    }

    private void ensureKbArticleExists(String title, String category, List<String> tags, String body, String status) {
        if (kbArticleRepository.existsByTitle(title)) {
            return;
        }

        KbArticle article = new KbArticle(title, category, tags, body);
        article.setStatus(status);
        if (!"draft".equals(status)) {
            article.setLastIngestedAt(Instant.now());
        }
        kbArticleRepository.save(article);
        log.info("Seeded KB article '{}'", title);
    }

    private void ensureDefaultRefundsExist() {
        ensureRefundExists("RF-1001", "ORD-58291", "Nadia Fathy", new BigDecimal("42.50"),
                "Item arrived damaged", "AI Assistant", at(2026, 8, 3, 14, 12),
                null, null, null);

        ensureRefundExists("RF-1002", "ORD-58305", "Omar Adel", new BigDecimal("315.00"),
                "Order never delivered — carrier lost package", "AI Assistant", at(2026, 8, 3, 16, 40),
                null, null, null);

        ensureRefundExists("RF-1003", "ORD-58260", "Lina Sabry", new BigDecimal("18.99"),
                "Duplicate charge", "AI Assistant", at(2026, 8, 2, 9, 5),
                "approved", "Confirmed duplicate in billing system.", "Karim (ADMIN)");

        ensureRefundExists("RF-1004", "ORD-58198", "Youssef Amin", new BigDecimal("610.00"),
                "Customer cancelled within window, high-value electronics", "AI Assistant", at(2026, 8, 1, 11, 22),
                "rejected", "Cancellation window had already closed; escalated to billing instead.", "Karim (ADMIN)");

        ensureRefundExists("RF-1005", "ORD-58312", "Mona Kamal", new BigDecimal("75.25"),
                "Wrong item shipped", "AI Assistant", at(2026, 8, 4, 8, 50),
                null, null, null);
    }

    private void ensureRefundExists(String code, String orderNumber, String customerName, BigDecimal amount,
                                     String reason, String requestedBy, Instant requestedAt,
                                     String decidedStatus, String note, String decidedBy) {
        if (refundRepository.existsByCode(code)) {
            return;
        }

        Refund refund = new Refund(code, orderNumber, customerName, amount, reason, requestedBy, requestedAt);
        if (decidedStatus != null) {
            refund.setStatus("approved".equals(decidedStatus)
                    ? RefundStatus.APPROVED
                    : RefundStatus.REJECTED);
            refund.setNote(note);
            refund.setDecidedBy(decidedBy);
            refund.setDecidedAt(requestedAt);
        }
        refundRepository.save(refund);
        log.info("Seeded refund request '{}'", code);
    }

    private void ensureDefaultAuditEntriesExist() {
        // Restored at the user's explicit request for demo continuity. Only the
        // refund_approved/refund_rejected rows below correspond to real seeded
        // Refund decisions (RF-1003 / RF-1004 above) - the rest (logins, KB
        // edits, ticket escalations) are historical flavor only; nothing in the
        // app writes those action types for real yet.
        ensureAuditEntryExists("AU-3001", "refund_approved", "Karim (ADMIN)", "RF-1003 · Lina Sabry",
                "Approved $18.99 — confirmed duplicate in billing system.", at(2026, 8, 4, 9, 2));

        ensureAuditEntryExists("AU-3002", "ticket_escalated", "AI Assistant", "TCK-7742",
                "Escalated to human agent — customer requested manager.", at(2026, 8, 4, 8, 55));

        ensureAuditEntryExists("AU-3003", "refund_rejected", "Karim (ADMIN)", "RF-1004 · Youssef Amin",
                "Rejected $610.00 — cancellation window had closed.", at(2026, 8, 3, 17, 10));

        ensureAuditEntryExists("AU-3004", "kb_updated", "Karim (ADMIN)", "Warranty claims — storage devices",
                "Edited body text, tags unchanged.", at(2026, 8, 3, 15, 40));

        ensureAuditEntryExists("AU-3005", "kb_ingested", "Karim (ADMIN)", "Warranty claims — storage devices",
                "Re-ingested after edit — old chunks replaced.", at(2026, 8, 3, 15, 41));

        ensureAuditEntryExists("AU-3006", "login", "Karim (ADMIN)", "—",
                "Signed in from admin console.", at(2026, 8, 2, 11, 5));

        ensureAuditEntryExists("AU-3007", "ticket_escalated", "Sara (AGENT)", "TCK-7699",
                "Escalated — needed refund above agent authority.", at(2026, 8, 1, 13, 22));

        ensureAuditEntryExists("AU-3008", "kb_created", "Karim (ADMIN)", "Bulk order discount tiers",
                "New article created as draft.", at(2026, 7, 30, 10, 12));
    }

    private void ensureAuditEntryExists(String seedKey, String action, String actor, String target,
                                         String detail, Instant createdAt) {
        if (auditLogRepository.existsBySeedKey(seedKey)) {
            return;
        }

        AuditLogEntry entry = new AuditLogEntry(action, actor, target, detail);
        entry.setSeedKey(seedKey);
        entry.setCreatedAt(createdAt);
        auditLogRepository.save(entry);
        log.info("Seeded audit entry '{}'", seedKey);
    }

    private Instant at(int year, int month, int day, int hour, int minute) {
        return LocalDateTime.of(year, month, day, hour, minute).atZone(ZoneId.systemDefault()).toInstant();
    }
}
