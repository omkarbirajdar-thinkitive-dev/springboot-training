package com.example.Springboot_traning.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewLeaveRequest {
    @Size(max = 500, message = "Comment cannot exceed 500 characters")
    private String adminComment;
}
