package com.ayush.doctorapp.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.ayush.doctorapp.models.EmergencyItem
import com.ayush.doctorapp.models.EmergencyDetail
import com.ayush.doctorapp.network.ApiClient
import com.ayush.doctorapp.network.ApiResult
import kotlinx.coroutines.launch

class EmergencyViewModel(application: Application) : AndroidViewModel(application) {

    private val _emergencies = MutableLiveData<ApiResult<List<EmergencyItem>>>()
    val emergencies: LiveData<ApiResult<List<EmergencyItem>>> = _emergencies

    private val _emergencyDetail = MutableLiveData<ApiResult<EmergencyDetail>>()
    val emergencyDetail: LiveData<ApiResult<EmergencyDetail>> = _emergencyDetail

    fun getEmergencyQueue(token: String) {
        viewModelScope.launch {
            _emergencies.value = ApiResult.Loading
            try {
                val response = ApiClient.apiService.getEmergencyQueue("Bearer $token")
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null && body.success) {
                        _emergencies.value = ApiResult.Success(body.data, body.message)
                    } else {
                        _emergencies.value = ApiResult.Error(body?.message ?: "Failed to load")
                    }
                } else {
                    _emergencies.value = ApiResult.Error("Error: ${response.code()}")
                }
            } catch (e: Exception) {
                _emergencies.value = ApiResult.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun getEmergencyDetail(token: String, emergencyId: String) {
        viewModelScope.launch {
            _emergencyDetail.value = ApiResult.Loading
            try {
                val response = ApiClient.apiService.getEmergencyDetail("Bearer $token", emergencyId)
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null && body.success) {
                        _emergencyDetail.value = ApiResult.Success(body.data, body.message)
                    } else {
                        _emergencyDetail.value = ApiResult.Error(body?.message ?: "Failed to load")
                    }
                } else {
                    _emergencyDetail.value = ApiResult.Error("Error: ${response.code()}")
                }
            } catch (e: Exception) {
                _emergencyDetail.value = ApiResult.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun updateEmergencyStatus(token: String, emergencyId: String, status: String) {
        viewModelScope.launch {
            try {
                val response = ApiClient.apiService.updateEmergencyStatus(
                    "Bearer $token",
                    emergencyId,
                    mapOf("status" to status)
                )
                if (response.isSuccessful) {
                    getEmergencyQueue(token)
                }
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
}