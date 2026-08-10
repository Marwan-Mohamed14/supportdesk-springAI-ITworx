package com.itworx.supportdesk.dto.kb;

import java.util.UUID;

/**
 * Body for POST /api/kb/ingest. articleId is optional - omit it (or send
 * {}/null) to re-ingest every article, per story F2.
 */
public record KbIngestRequest(
        UUID articleId
) {
}
