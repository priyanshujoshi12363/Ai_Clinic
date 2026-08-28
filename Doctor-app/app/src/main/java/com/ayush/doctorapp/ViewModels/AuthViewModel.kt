package com.ayush.doctorapp.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.ayush.doctorapp.models.LoginRequest
import com.ayush.doctorapp.models.LoginResponse
import com.ayush.doctorapp.models.RegisterRequest
import com.ayush.doctorapp.network.ApiClient
import com.ayush.doctorapp.network.ApiResult
import com.ayush.doctorapp.utils.TokenManager
import kotlinx.coroutines.launch

class AuthViewModel(application: Application) : AndroidViewModel(application) {
    
    private val tokenManager = TokenManager(application)
    
    private val _loginResult = MutableLiveData<ApiResult<LoginResponse>>()
    val loginResult: LiveData<ApiResult<LoginResponse>> = _loginResult
    
    private val _registerResult = MutableLiveData<ApiResult<LoginResponse>>()
    val registerResult: LiveData<ApiResult<LoginResponse>> = _registerResult
    
    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading
    
    fun login(username: String, password: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = ApiClient.apiService.loginDoctor(
                    LoginRequest(username, password)
                )
                
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null && body.success) {
                        val data = body.data
                        if (data != null) {
                            tokenManager.saveToken(data.token)
                            _loginResult.value = ApiResult.Success(data, body.message)
                        } else {
                            _loginResult.value = ApiResult.Error("No data received")
                        }
                    } else {
                        _loginResult.value = ApiResult.Error(body?.message ?: "Login failed")
                    }
                } else {
                    _loginResult.value = ApiResult.Error("Error: ${response.code()}")
                }
            } catch (e: Exception) {
                _loginResult.value = ApiResult.Error(e.message ?: "Unknown error")
            }
            _isLoading.value = false
        }
    }
    
    fun register(request: RegisterRequest) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = ApiClient.apiService.registerDoctor(request)
                
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null && body.success) {
                        val data = body.data
                        if (data != null) {
                            tokenManager.saveToken(data.token)
                            _registerResult.value = ApiResult.Success(data, body.message)
                        } else {
                            _registerResult.value = ApiResult.Error("No data received")
                        }
                    } else {
                        _registerResult.value = ApiResult.Error(body?.message ?: "Registration failed")
                    }
                } else {
                    _registerResult.value = ApiResult.Error("Error: ${response.code()}")
                }
            } catch (e: Exception) {
                _registerResult.value = ApiResult.Error(e.message ?: "Unknown error")
            }
            _isLoading.value = false
        }
    }
    
    fun logout() {
        tokenManager.clearAll()
    }
}