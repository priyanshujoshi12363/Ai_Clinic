package com.ayush.doctorapp.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.ayush.doctorapp.models.BriefingRequest
import com.ayush.doctorapp.models.BriefingResponse
import com.ayush.doctorapp.models.Doctor
import com.ayush.doctorapp.models.EmergencyCase
import com.ayush.doctorapp.models.IntakeSession
import com.ayush.doctorapp.models.LoginRequest
import com.ayush.doctorapp.models.LoginResponse
import com.ayush.doctorapp.models.OpdCase
import com.ayush.doctorapp.models.RegisterRequest
import com.ayush.doctorapp.models.StatusUpdate
import com.ayush.doctorapp.network.ApiClient
import com.ayush.doctorapp.network.ApiResult
import com.ayush.doctorapp.network.safeCall
import com.ayush.doctorapp.utils.TokenManager
import kotlinx.coroutines.launch

class AuthViewModel(application: Application) : AndroidViewModel(application) {

    private val tokenManager = TokenManager(application)

    private val _result = MutableLiveData<ApiResult<LoginResponse>>()
    val result: LiveData<ApiResult<LoginResponse>> = _result

    private val _profile = MutableLiveData<ApiResult<Doctor>>()
    val profile: LiveData<ApiResult<Doctor>> = _profile

    fun login(username: String, password: String) {
        viewModelScope.launch {
            _result.value = ApiResult.Loading
            val outcome = safeCall { ApiClient.apiService.loginDoctor(LoginRequest(username, password)) }
            if (outcome is ApiResult.Success) tokenManager.saveSession(outcome.data)
            _result.value = outcome
        }
    }

    fun register(request: RegisterRequest) {
        viewModelScope.launch {
            _result.value = ApiResult.Loading
            val outcome = safeCall { ApiClient.apiService.registerDoctor(request) }
            if (outcome is ApiResult.Success) tokenManager.saveSession(outcome.data)
            _result.value = outcome
        }
    }

    fun loadProfile() {
        viewModelScope.launch {
            _profile.value = ApiResult.Loading
            _profile.value = safeCall { ApiClient.apiService.getProfile(tokenManager.bearer()) }
        }
    }

    fun logout() = tokenManager.clear()
}

class OpdQueueViewModel(application: Application) : AndroidViewModel(application) {

    private val _queue = MutableLiveData<ApiResult<List<OpdCase>>>()
    val queue: LiveData<ApiResult<List<OpdCase>>> = _queue

    private val _session = MutableLiveData<ApiResult<IntakeSession>>()
    val session: LiveData<ApiResult<IntakeSession>> = _session

    private val _briefing = MutableLiveData<ApiResult<BriefingResponse>>()
    val briefing: LiveData<ApiResult<BriefingResponse>> = _briefing

    fun load() {
        viewModelScope.launch {
            _queue.value = ApiResult.Loading
            _queue.value = safeCall { ApiClient.apiService.getOpdQueue() }
        }
    }

    fun loadSession(sessionId: String) {
        viewModelScope.launch {
            _session.value = ApiResult.Loading
            _session.value = safeCall { ApiClient.apiService.getSession(sessionId) }
        }
    }

    fun loadBriefing(sessionId: String) {
        viewModelScope.launch {
            _briefing.value = ApiResult.Loading
            _briefing.value = safeCall {
                ApiClient.apiService.getSessionBriefing(sessionId, BriefingRequest())
            }
        }
    }
}

class EmergencyViewModel(application: Application) : AndroidViewModel(application) {

    private val _queue = MutableLiveData<ApiResult<List<EmergencyCase>>>()
    val queue: LiveData<ApiResult<List<EmergencyCase>>> = _queue

    private val _detail = MutableLiveData<ApiResult<EmergencyCase>>()
    val detail: LiveData<ApiResult<EmergencyCase>> = _detail

    private val _briefing = MutableLiveData<ApiResult<BriefingResponse>>()
    val briefing: LiveData<ApiResult<BriefingResponse>> = _briefing

    private val _statusUpdated = MutableLiveData<ApiResult<EmergencyCase>>()
    val statusUpdated: LiveData<ApiResult<EmergencyCase>> = _statusUpdated

    fun load() {
        viewModelScope.launch {
            _queue.value = ApiResult.Loading
            _queue.value = safeCall { ApiClient.apiService.getEmergencyQueue() }
        }
    }

    fun loadCase(tokenNumber: String) {
        viewModelScope.launch {
            _detail.value = ApiResult.Loading
            _detail.value = safeCall { ApiClient.apiService.getEmergencyCase(tokenNumber) }
        }
    }

    fun loadBriefing(tokenNumber: String) {
        viewModelScope.launch {
            _briefing.value = ApiResult.Loading
            _briefing.value = safeCall {
                ApiClient.apiService.getEmergencyBriefing(tokenNumber, BriefingRequest())
            }
        }
    }

    fun updateStatus(tokenNumber: String, status: String, attendedBy: String?) {
        viewModelScope.launch {
            _statusUpdated.value = ApiResult.Loading
            _statusUpdated.value = safeCall {
                ApiClient.apiService.updateEmergencyStatus(tokenNumber, StatusUpdate(status, attendedBy))
            }
        }
    }
}
