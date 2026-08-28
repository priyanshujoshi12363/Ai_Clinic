package com.ayush.doctorapp.models

data class ApiResponse<T>(
    val success: Boolean,
    val message: String?,
    val data: T?,
    val count: Int?
)

data class LoginRequest(
    val username: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val doctorId: String,
    val name: DoctorName,
    val email: String,
    val username: String,
    val role: String,
    val specialization: String,
    val hospital: HospitalInfo
)

data class RegisterRequest(
    val doctorId: String,
    val name: DoctorName,
    val registrationNumber: String,
    val specialization: String,
    val hospital: HospitalInfo,
    val contact: ContactInfo,
    val consultation: ConsultationInfo,
    val account: AccountRegister
)

data class AccountRegister(
    val username: String,
    val password: String,
    val role: String = "DOCTOR"
)

data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)

data class FaceSearchRequest(
    val faceImage: String,
    val threshold: Double = 0.75
)

data class FaceSearchResponse(
    val found: Boolean,
    val confidence: Double,
    val data: Patient?
)