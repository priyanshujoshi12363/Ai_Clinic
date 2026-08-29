package com.ayush.doctorapp.Utils

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import com.google.gson.Gson
import com.ayush.doctorapp.Models.Doctor
import java.security.GeneralSecurityException

class TokenManager(private val context: Context) {

    private val prefsName = "secure_prefs"

    private val sharedPreferences: SharedPreferences by lazy {
        try {
            val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
            EncryptedSharedPreferences.create(
                prefsName,
                masterKeyAlias,
                context,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: GeneralSecurityException) {
            Log.w(TAG, "Falling back to plain prefs: ${e.message}")
            context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
        } catch (e: Exception) {
            Log.w(TAG, "Falling back to plain prefs: ${e.message}")
            context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
        }
    }

    fun saveToken(token: String) {
        runCatching { sharedPreferences.edit().putString(Constants.KEY_TOKEN, token).apply() }
    }

    fun getToken(): String? = runCatching { sharedPreferences.getString(Constants.KEY_TOKEN, null) }.getOrNull()

    fun saveDoctor(doctor: Doctor) {
        runCatching {
            val json = Gson().toJson(doctor)
            sharedPreferences.edit().putString(Constants.KEY_DOCTOR_DATA, json).apply()
        }
    }

    fun getDoctor(): Doctor? {
        return runCatching {
            val json = sharedPreferences.getString(Constants.KEY_DOCTOR_DATA, null)
            if (json != null) Gson().fromJson(json, Doctor::class.java) else null
        }.getOrNull()
    }

    fun clearAll() {
        runCatching { sharedPreferences.edit().clear().apply() }
    }

    fun isLoggedIn(): Boolean = !getToken().isNullOrEmpty()

    companion object {
        private const val TAG = "TokenManager"
    }
}
