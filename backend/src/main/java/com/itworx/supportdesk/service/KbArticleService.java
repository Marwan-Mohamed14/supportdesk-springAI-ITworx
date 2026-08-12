package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.KbArticleCreateRequest;
import com.itworx.supportdesk.dto.KbArticleResponse;
import com.itworx.supportdesk.dto.KbArticleUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface KbArticleService {

    KbArticleResponse create(KbArticleCreateRequest request);

    List<KbArticleResponse> list();

    KbArticleResponse update(UUID id, KbArticleUpdateRequest request);

    KbArticleResponse ingest(UUID id);

    List<KbArticleResponse> ingestAll();
}
