package com.ayush.doctorapp.Models

data class Doctor(
    val doctorId: String,
    val name: DoctorName,
    val registrationNumber: String,
    val specialization: String,
    val hospital: HospitalInfo,
    val contact: ContactInfo,
    val consultation: ConsultationInfo,
    val account: AccountInfo,
    val createdAt: String,
    val updatedAt: String
)

data class DoctorName(
    val firstName: String,
    val middleName: String?,
    val lastName: String
)

data class HospitalInfo(
    val hospitalId: String,
    val hospitalName: String,
    val departmentId: String,
    val departmentName: String
)

data class ContactInfo(
    val mobile: String,
    val email: String
)

data class ConsultationInfo(
    val types: List<String>
)

data class AccountInfo(
    val username: String,
    val role: String,
    val active: Boolean,
    val lastLogin: String?
)