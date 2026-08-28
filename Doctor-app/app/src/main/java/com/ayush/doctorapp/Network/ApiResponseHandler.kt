package com.ayush.doctorapp.network

import com.ayush.doctorapp.models.ApiResponse
import retrofit2.Response
import java.io.IOException

class ApiResponseHandler {
    
    suspend fun <T> handleApiResponse(
        apiCall: suspend () -> Response<ApiResponse<T>>
    ): ApiResult<T> {
        return try {
            val response = apiCall.invoke()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null && body.success) {
                    ApiResult.Success(body.data, body.message)
                } else {
                    ApiResult.Error(body?.message ?: "Unknown error")
                }
            } else {
                ApiResult.Error("Error ${response.code()}: ${response.message()}")
            }
        } catch (e: IOException) {
            ApiResult.Error("Network error: ${e.message}")
        } catch (e: Exception) {
            ApiResult.Error("Unexpected error: ${e.message}")
        }
    }
}

sealed class ApiResult<out T> {
    data class Success<T>(val data: T?, val message: String?) : ApiResult<T>()
    data class Error(val message: String) : ApiResult<Nothing>()
    object Loading : ApiResult<Nothing>()
}