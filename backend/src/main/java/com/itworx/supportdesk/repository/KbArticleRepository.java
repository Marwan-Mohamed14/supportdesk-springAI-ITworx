package com.itworx.supportdesk.repository;

import com.itworx.supportdesk.entity.KbArticle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface KbArticleRepository extends JpaRepository<KbArticle, UUID> {
    List<KbArticle> findAllByOrderByCreatedAtDesc();

    // Used by DataSeeder to seed starter articles idempotently, one at a time.
    boolean existsByTitle(String title);
}
