package com.ayush.doctorapp.network

import com.ayush.doctorapp.models.ApiResponse
import retrofit2.Response
import java.io.IOException

sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error(val message: String) : ApiResult<Nothing>()
    object Loading : ApiResult<Nothing>()
}

suspend fun <T> safeCall(call: suspend () -> Response<ApiResponse<T>>): ApiResult<T> {
    return try {
        val response = call()
        val body = response.body()

        when {
            !response.isSuccessful ->
                ApiResult.Error(body?.message ?: "Server error ${response.code()}")
            body == null ->
                ApiResult.Error("Empty response from server")
            !body.success ->
                ApiResult.Error(body.message ?: "Request failed")
            body.data == null ->
                ApiResult.Error("No data returned")
            else -> ApiResult.Success(body.data)
        }
    } catch (e: IOException) {
        ApiResult.Error("Cannot reach the server. Check your connection.")
    } catch (e: Exception) {
        ApiResult.Error(e.message ?: "Unexpected error")
    }
}
