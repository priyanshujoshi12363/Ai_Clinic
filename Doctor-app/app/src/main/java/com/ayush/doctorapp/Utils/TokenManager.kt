package com.ayush.doctorapp.utils

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.ayush.doctorapp.models.LoginResponse
import com.google.gson.Gson

class TokenManager(context: Context) {

    private val appContext = context.applicationContext

    private val prefs: SharedPreferences by lazy {
        try {
            val masterKey = MasterKey.Builder(appContext)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            EncryptedSharedPreferences.create(
                appContext,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            Log.w(TAG, "Encrypted prefs unavailable, falling back: ${e.message}")
            appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }
    }

    fun saveSession(login: LoginResponse) {
        prefs.edit()
            .putString(Constants.KEY_TOKEN, login.token)
            .putString(Constants.KEY_DOCTOR, Gson().toJson(login))
            .apply()
    }

    fun getToken(): String? = prefs.getString(Constants.KEY_TOKEN, null)

    fun bearer(): String = "Bearer ${getToken().orEmpty()}"

    fun getDoctor(): LoginResponse? = runCatching {
        prefs.getString(Constants.KEY_DOCTOR, null)?.let {
            Gson().fromJson(it, LoginResponse::class.java)
        }
    }.getOrNull()

    fun isLoggedIn(): Boolean = !getToken().isNullOrBlank()

    fun clear() = prefs.edit().clear().apply()

    companion object {
        private const val PREFS_NAME = "doctor_secure_prefs"
        private const val TAG = "TokenManager"
    }
}
