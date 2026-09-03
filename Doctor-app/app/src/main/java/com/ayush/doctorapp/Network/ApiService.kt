package com.ayush.doctorapp.network

import com.ayush.doctorapp.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("doctor/register")
    suspend fun registerDoctor(@Body request: RegisterRequest): Response<ApiResponse<LoginResponse>>

    @POST("doctor/login")
    suspend fun loginDoctor(@Body request: LoginRequest): Response<ApiResponse<LoginResponse>>

    @GET("doctor/profile")
    suspend fun getProfile(@Header("Authorization") token: String): Response<ApiResponse<Doctor>>

    @PUT("doctor/change-password")
    suspend fun changePassword(
        @Header("Authorization") token: String,
        @Body request: ChangePasswordRequest
    ): Response<ApiResponse<Unit>>

    @POST("doctor/logout")
    suspend fun logout(@Header("Authorization") token: String): Response<ApiResponse<Unit>>

    @GET("intake/queue")
    suspend fun getOpdQueue(@Query("mode") mode: String? = null): Response<ApiResponse<List<OpdCase>>>

    @GET("intake/{sessionId}")
    suspend fun getSession(@Path("sessionId") sessionId: String): Response<ApiResponse<IntakeSession>>

    @POST("intake/{sessionId}/briefing")
    suspend fun getSessionBriefing(
        @Path("sessionId") sessionId: String,
        @Body request: BriefingRequest
    ): Response<ApiResponse<BriefingResponse>>

    @GET("emergency/queue")
    suspend fun getEmergencyQueue(): Response<ApiResponse<List<EmergencyCase>>>

    @GET("emergency/{tokenNumber}")
    suspend fun getEmergencyCase(@Path("tokenNumber") tokenNumber: String): Response<ApiResponse<EmergencyCase>>

    @PUT("emergency/{tokenNumber}/status")
    suspend fun updateEmergencyStatus(
        @Path("tokenNumber") tokenNumber: String,
        @Body request: StatusUpdate
    ): Response<ApiResponse<EmergencyCase>>

    @POST("emergency/{tokenNumber}/briefing")
    suspend fun getEmergencyBriefing(
        @Path("tokenNumber") tokenNumber: String,
        @Body request: BriefingRequest
    ): Response<ApiResponse<BriefingResponse>>

    // ---- Prescriptions (doctor prescribes) ----
    @GET("clinical/medicines")
    suspend fun searchMedicines(@Query("q") q: String): Response<ApiResponse<List<Medicine>>>

    @POST("clinical/patient/{abhaId}/prescription")
    suspend fun createPrescription(
        @Path("abhaId") abhaId: String,
        @Body request: CreatePrescriptionRequest
    ): Response<ApiResponse<PrescriptionResult>>

    @GET("clinical/patient/{abhaId}")
    suspend fun getClinicalPatient(@Path("abhaId") abhaId: String): Response<ApiResponse<ClinicalPatient>>

    @PUT("clinical/patient/{abhaId}/prescription/{prescriptionId}")
    suspend fun updatePrescription(
        @Path("abhaId") abhaId: String,
        @Path("prescriptionId") prescriptionId: String,
        @Body request: CreatePrescriptionRequest
    ): Response<ApiResponse<Unit>>
}
