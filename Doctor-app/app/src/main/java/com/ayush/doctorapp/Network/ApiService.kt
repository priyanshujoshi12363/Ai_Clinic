package com.ayush.doctorapp.Network

import com.ayush.doctorapp.Models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    @POST("doctors/register")
    suspend fun registerDoctor(
        @Body request: RegisterRequest
    ): Response<ApiResponse<LoginResponse>>
    
    @POST("doctors/login")
    suspend fun loginDoctor(
        @Body request: LoginRequest
    ): Response<ApiResponse<LoginResponse>>
    
    @GET("doctors/profile")
    suspend fun getProfile(
        @Header("Authorization") token: String
    ): Response<ApiResponse<Doctor>>
    
    @PUT("doctors/profile")
    suspend fun updateProfile(
        @Header("Authorization") token: String,
        @Body doctor: Doctor
    ): Response<ApiResponse<Doctor>>
    
    @PUT("doctors/change-password")
    suspend fun changePassword(
        @Header("Authorization") token: String,
        @Body request: ChangePasswordRequest
    ): Response<ApiResponse<Unit>>
    
    @POST("doctors/logout")
    suspend fun logout(
        @Header("Authorization") token: String
    ): Response<ApiResponse<Unit>>
    
    @GET("patients")
    suspend fun getPatients(
        @Header("Authorization") token: String
    ): Response<ApiResponse<List<Patient>>>
    
    @GET("patients/abha/{abhaId}")
    suspend fun getPatientById(
        @Header("Authorization") token: String,
        @Path("abhaId") abhaId: String
    ): Response<ApiResponse<Patient>>
    
    @POST("face-search/search")
    suspend fun searchByFace(
        @Header("Authorization") token: String,
        @Body request: FaceSearchRequest
    ): Response<ApiResponse<FaceSearchResponse>>
}