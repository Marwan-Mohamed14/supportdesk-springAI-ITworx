package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.RefundResponse;

import java.util.List;
import java.util.UUID;

public interface RefundService {

    List<RefundResponse> list(String status, Boolean overLimit);

    RefundResponse approve(UUID id, String note, String actorEmail);

    RefundResponse reject(UUID id, String note, String actorEmail);
}
