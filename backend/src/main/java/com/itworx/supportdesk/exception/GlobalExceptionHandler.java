package com.itworx.supportdesk.exception;

import com.openai.errors.OpenAIException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.ResourceAccessException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ProductNotFoundException.class)
    public ProblemDetail handleNotFound(ProductNotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Product Not Found", ex.getMessage());
    }

    @ExceptionHandler(DuplicateSkuException.class)
    public ProblemDetail handleDuplicateSku(DuplicateSkuException ex) {
        return problem(HttpStatus.CONFLICT, "Duplicate SKU", ex.getMessage());
    }

    @ExceptionHandler(DuplicateEmailException.class)
    public ProblemDetail handleDuplicateEmail(DuplicateEmailException ex) {
        return problem(HttpStatus.CONFLICT, "Duplicate Email", ex.getMessage());
    }

    @ExceptionHandler(InvalidProductStateException.class)
    public ProblemDetail handleInvalidState(InvalidProductStateException ex) {
        return problem(HttpStatus.BAD_REQUEST, "Invalid Request", ex.getMessage());
    }

    @ExceptionHandler(CustomerNotFoundException.class)
    public ProblemDetail handleCustomerNotFound(CustomerNotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Customer Not Found", ex.getMessage());
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ProblemDetail handleInsufficientStock(InsufficientStockException ex) {
        return problem(HttpStatus.CONFLICT, "Insufficient Stock", ex.getMessage());
    }

    @ExceptionHandler(TicketNotFoundException.class)
    public ProblemDetail handleTicketNotFound(TicketNotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Ticket Not Found", ex.getMessage());
    }

    @ExceptionHandler(InvalidTicketStateException.class)
    public ProblemDetail handleInvalidTicketState(InvalidTicketStateException ex) {
        return problem(HttpStatus.CONFLICT, "Invalid Ticket State", ex.getMessage());
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ProblemDetail handleUserNotFound(UserNotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "User Not Found", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        fe -> fe.getField(),
                        fe -> fe.getDefaultMessage() == null ? "invalid" : fe.getDefaultMessage(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
        ProblemDetail pd = problem(HttpStatus.BAD_REQUEST, "Validation Failed",
                "One or more fields are invalid.");
        pd.setProperty("errors", fieldErrors);
        return pd;
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail handleConstraintViolation(ConstraintViolationException ex) {
        return problem(HttpStatus.BAD_REQUEST, "Validation Failed", ex.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleUnreadable(HttpMessageNotReadableException ex) {
        return problem(HttpStatus.BAD_REQUEST, "Malformed Request", "Request body is missing or malformed JSON.");
    }
    @ExceptionHandler(org.springframework.security.authentication.BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(org.springframework.security.authentication.BadCredentialsException ex) {
        return problem(HttpStatus.UNAUTHORIZED, "Invalid Credentials", "Invalid email or password.");
    }

    // Ollama (or any other RestClient-based AI call) unreachable - e.g. the local
    // embedding service isn't running. Without this handler the exception escaped
    // unformatted and confusingly surfaced to the client as a 401.
    @ExceptionHandler(ResourceAccessException.class)
    public ProblemDetail handleAiServiceUnreachable(ResourceAccessException ex) {
        return problem(HttpStatus.SERVICE_UNAVAILABLE, "AI Service Unavailable",
                "The assistant's AI service isn't reachable right now. Please try again shortly.");
    }

    // Base type for every error the openai-java SDK throws (bad request, auth,
    // rate limit, 5xx from the provider, etc.) - covers Groq's OpenAI-compatible
    // chat endpoint used by ChatbotService. Catches the family instead of every
    // concrete subtype (NotFoundException, RateLimitException, ...) individually.
    @ExceptionHandler(OpenAIException.class)
    public ProblemDetail handleAiServiceError(OpenAIException ex) {
        return problem(HttpStatus.BAD_GATEWAY, "AI Service Error", ex.getMessage());
    }

    @ExceptionHandler(KbArticleNotFoundException.class)
    public ProblemDetail handleKbArticleNotFound(KbArticleNotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Article Not Found", ex.getMessage());
    }

    @ExceptionHandler(RefundNotFoundException.class)
    public ProblemDetail handleRefundNotFound(RefundNotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Refund Not Found", ex.getMessage());
    }

    @ExceptionHandler(InvalidRefundStateException.class)
    public ProblemDetail handleInvalidRefundState(InvalidRefundStateException ex) {
        return problem(HttpStatus.CONFLICT, "Invalid Refund State", ex.getMessage());
    }

    @ExceptionHandler(RefundNoteRequiredException.class)
    public ProblemDetail handleRefundNoteRequired(RefundNoteRequiredException ex) {
        return problem(HttpStatus.BAD_REQUEST, "Justification Required", ex.getMessage());
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ProblemDetail handleOrderNotFound(OrderNotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Order Not Found", ex.getMessage());
    }

    @ExceptionHandler(InvalidOrderStatusTransitionException.class)
    public ProblemDetail handleInvalidOrderStatusTransition(InvalidOrderStatusTransitionException ex) {
        return problem(HttpStatus.CONFLICT, "Invalid Order Status Transition", ex.getMessage());
    }

    private ProblemDetail problem(HttpStatus status, String title, String detail) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setTitle(title);
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }
}
