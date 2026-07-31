package com.itworx.supportdesk.exception;

public class InvalidProductStateException extends RuntimeException {

    public InvalidProductStateException(String message) {
        super(message);
    }
}