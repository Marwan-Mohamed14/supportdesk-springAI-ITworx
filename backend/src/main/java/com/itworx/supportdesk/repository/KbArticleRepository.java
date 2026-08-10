package com.itworx.supportdesk.repository;

import com.itworx.supportdesk.model.kb.KbArticle;
import com.itworx.supportdesk.model.kb.KbArticleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface KbArticleRepository extends JpaRepository<KbArticle, UUID> {

    @Query(
            value = "SELECT DISTINCT a FROM KbArticle a LEFT JOIN a.tags t " +
                    "WHERE (:q IS NULL OR LOWER(a.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(t) LIKE LOWER(CONCAT('%', :q, '%'))) " +
                    "AND (:category IS NULL OR LOWER(a.category) = LOWER(:category)) " +
                    "AND (:status IS NULL OR a.status = :status)",
            countQuery = "SELECT COUNT(DISTINCT a) FROM KbArticle a LEFT JOIN a.tags t " +
                    "WHERE (:q IS NULL OR LOWER(a.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(t) LIKE LOWER(CONCAT('%', :q, '%'))) " +
                    "AND (:category IS NULL OR LOWER(a.category) = LOWER(:category)) " +
                    "AND (:status IS NULL OR a.status = :status)"
    )
    Page<KbArticle> search(
            @Param("q") String q,
            @Param("category") String category,
            @Param("status") KbArticleStatus status,
            Pageable pageable
    );
}
