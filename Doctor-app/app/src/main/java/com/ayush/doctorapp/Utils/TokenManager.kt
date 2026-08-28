package com.ayush.doctorapp.utils

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import com.google.gson.Gson
import com.ayush.doctorapp.models.Doctor
import java.security.GeneralSecurityException

class TokenManager(private val context: Context) {

    private val sharedPreferences: SharedPreferences by lazy {
        try {
            val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
            EncryptedSharedPreferences.create(
                "secure_prefs",
                masterKeyAlias,
                context,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: GeneralSecurityException) {
            context.getSharedPreferences("secure_prefs", Context.MODE_PRIVATE)
        }
    }

    fun saveToken(token: String) {
        sharedPreferences.edit().putString(Constants.KEY_TOKEN, token).apply()
    }

    fun getToken(): String? {
        return sharedPreferences.getString(Constants.KEY_TOKEN, null)
    }

    fun saveDoctor(doctor: Doctor) {
        val json = Gson().toJson(doctor)
        sharedPreferences.edit().putString(Constants.KEY_DOCTOR_DATA, json).apply()
    }

    fun getDoctor(): Doctor? {
        val json = sharedPreferences.getString(Constants.KEY_DOCTOR_DATA, null)
        return if (json != null) Gson().fromJson(json, Doctor::class.java) else null
    }

    fun clearAll() {
        sharedPreferences.edit().clear().apply()
    }

    fun isLoggedIn(): Boolean {
        return !getToken().isNullOrEmpty()
    }
}