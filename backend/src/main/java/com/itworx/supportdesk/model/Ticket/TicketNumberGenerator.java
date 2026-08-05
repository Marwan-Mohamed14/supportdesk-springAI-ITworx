package com.itworx.supportdesk.model.Ticket;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.UUID;

@Component
public class TicketNumberGenerator {
    public String generate() {
        String datePart = LocalDate.now().toString().replace("-", "");
        String randomPart = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "TKT-" + datePart + "-" + randomPart;
    }
}