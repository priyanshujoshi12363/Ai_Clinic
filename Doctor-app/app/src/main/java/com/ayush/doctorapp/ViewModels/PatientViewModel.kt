package com.ayush.doctorapp.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.ayush.doctorapp.models.Patient
import com.ayush.doctorapp.network.ApiClient
import com.ayush.doctorapp.network.ApiResult
import kotlinx.coroutines.launch

class PatientViewModel(application: Application) : AndroidViewModel(application) {
    
    private val _patients = MutableLiveData<ApiResult<List<Patient>>>()
    val patients: LiveData<ApiResult<List<Patient>>> = _patients
    
    private val _patientDetail = MutableLiveData<ApiResult<Patient>>()
    val patientDetail: LiveData<ApiResult<Patient>> = _patientDetail
    
    fun getPatients(token: String) {
        viewModelScope.launch {
            _patients.value = ApiResult.Loading
            try {
                val response = ApiClient.apiService.getPatients("Bearer $token")
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null && body.success) {
                        _patients.value = ApiResult.Success(body.data, body.message)
                    } else {
                        _patients.value = ApiResult.Error(body?.message ?: "Failed to load patients")
                    }
                } else {
                    _patients.value = ApiResult.Error("Error: ${response.code()}")
                }
            } catch (e: Exception) {
                _patients.value = ApiResult.Error(e.message ?: "Unknown error")
            }
        }
    }
    
    fun getPatientById(token: String, abhaId: String) {
        viewModelScope.launch {
            _patientDetail.value = ApiResult.Loading
            try {
                val response = ApiClient.apiService.getPatientById("Bearer $token", abhaId)
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null && body.success) {
                        _patientDetail.value = ApiResult.Success(body.data, body.message)
                    } else {
                        _patientDetail.value = ApiResult.Error(body?.message ?: "Patient not found")
                    }
                } else {
                    _patientDetail.value = ApiResult.Error("Error: ${response.code()}")
                }
            } catch (e: Exception) {
                _patientDetail.value = ApiResult.Error(e.message ?: "Unknown error")
            }
        }
    }
}