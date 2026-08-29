package com.ayush.doctorapp.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class EmergencyItem(
    val emergencyId: String,
    val abhaId: String,
    val patientName: String,
    val symptoms: List<String>,
    val urgency: String,
    val timestamp: String,
    val queuePosition: Int,
    val status: String
) : Parcelable

@Parcelize
data class EmergencyDetail(
    val emergencyId: String,
    val patient: PatientInfo,
    val symptoms: List<String>,
    val aiSummary: String,
    val medicalHistory: MedicalHistory?,
    val queueStatus: QueueStatus,
    val conversation: List<ConversationItem>?
) : Parcelable

@Parcelize
data class PatientInfo(
    val abhaId: String,
    val name: String,
    val age: Int,
    val gender: String,
    val mobile: String
) : Parcelable

@Parcelize
data class QueueStatus(
    val queueId: String,
    val queuePosition: Int,
    val urgency: String,
    val status: String
) : Parcelable

@Parcelize
data class ConversationItem(
    val question: String,
    val answer: String,
    val timestamp: String
) : Parcelable